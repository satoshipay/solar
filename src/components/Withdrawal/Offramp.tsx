import BigNumber from "big.js"
import { Buffer } from "buffer"
import React from "react"
import { Asset, Memo, Operation, Server, Transaction } from "stellar-sdk"
import Typography from "@material-ui/core/Typography"
import {
  TransferServer,
  WithdrawalKYCStatusResponse,
  WithdrawalRequestKYC,
  WithdrawalRequestSuccess,
  WithdrawalSuccessResponse
} from "@satoshipay/stellar-sep-6"
import { WebauthData } from "@satoshipay/stellar-sep-10"
import { Account } from "../../context/accounts"
import { trackError } from "../../context/notifications"
import { useWebAuth } from "../../hooks/stellar"
import { useLiveAccountData } from "../../hooks/stellar-subscriptions"
import { useRouter, RefStateObject } from "../../hooks/userinterface"
import { createTransaction, signTransaction } from "../../lib/transaction"
import * as routes from "../../routes"
import { ActionButton, DialogActionsBox } from "../Dialog/Generic"
import InlineLoader from "../InlineLoader"
import { Box } from "../Layout/Box"
import { usePolling } from "./util"
import { Action, initialState, stateMachine, BeforeWebauthState } from "./statemachine"
import { useAssetTransferServerInfos } from "./transferservice"
import WithdrawalKYCRedirect from "./WithdrawalKYCRedirect"
import WithdrawalKYCStatus from "./WithdrawalKYCStatus"
import AnchorWithdrawalInitForm from "./WithdrawalRequestForm"
import WithdrawalTransactionForm from "./WithdrawalTransactionForm"
import TransactionReviewDialog from "../TransactionReview/TransactionReviewDialog"
import Portal from "../Portal"

const kycPollIntervalMs = 6000

const doNothing = () => undefined

function createMemo(withdrawalResponse: WithdrawalSuccessResponse): Memo | null {
  const { memo, memo_type: type } = withdrawalResponse

  if (!memo || !type) {
    return null
  }

  switch (type) {
    case "hash":
      const hash = Buffer.from(memo, "base64")
      return Memo.hash(hash.toString("hex"))
    case "id":
      return Memo.id(memo)
    case "text":
      return Memo.text(memo)
    default:
      return null
  }
}

function sendWithdrawalRequest(request: WithdrawalRequestData, authToken?: string) {
  const { account, asset, withdrawalFormValues, method, transferServer } = request
  return transferServer.withdraw(method, asset.getCode(), authToken, { account, ...withdrawalFormValues } as any)
}

interface WithdrawalRequestData {
  account: string
  asset: Asset
  method: string
  withdrawalFormValues: { [fieldName: string]: string }
  transferServer: TransferServer
}

interface Props {
  account: Account
  actionsRef: RefStateObject
  assets: Asset[]
  horizon: Server
  onCancel: () => void
  onSubmit: (createTx: () => Promise<Transaction>) => Promise<any>
  testnet: boolean
}

function Offramp(props: Props) {
  const [currentState, dispatch] = React.useReducer(stateMachine, initialState)
  const [withdrawalRequestPending, setWithdrawalRequestPending] = React.useState(false)
  const [withdrawalResponsePending, setWithdrawalResponsePending] = React.useState(false)
  const router = useRouter()
  const WebAuth = useWebAuth()

  const accountData = useLiveAccountData(props.account.publicKey, props.account.testnet)
  const transferInfos = useAssetTransferServerInfos(props.assets, props.testnet)

  const withdrawableAssetCodes = Object.keys(transferInfos.data).filter(assetCode => {
    const transferInfo = transferInfos.data[assetCode].transferInfo
    return transferInfo.withdraw && transferInfo.withdraw.enabled
  })

  const createWithdrawalTx = async (amount: BigNumber, asset: Asset, response: WithdrawalSuccessResponse) => {
    const memo = createMemo(response)
    const payment = Operation.payment({
      amount: amount.toString(),
      asset,
      destination: response.account_id
    })
    return createTransaction([payment], {
      accountData,
      horizon: props.horizon,
      memo,
      walletAccount: props.account
    })
  }

  const sendWithdrawalTx = async (amount: BigNumber, asset: Asset, response: WithdrawalSuccessResponse) => {
    await props.onSubmit(() => createWithdrawalTx(amount, asset, response))
    router.history.push(routes.account(props.account.id))
  }

  const handleWithdrawalRequest = (response: WithdrawalRequestSuccess | WithdrawalRequestKYC) => {
    if (response.type === "success") {
      dispatch(Action.successfulKYC(response.data))
      stopKYCPolling()
    } else {
      if (response.data.type === "interactive_customer_info_needed") {
        dispatch(Action.startInteractiveKYC(response.data))
      } else if (response.data.type === "non_interactive_customer_info_needed") {
        throw Error("Non-interactive KYC is not yet supported.")
      } else if (response.data.type === "customer_info_status" && response.data.status === "pending") {
        dispatch(Action.pendingKYC(response.data as WithdrawalKYCStatusResponse<"pending">))
      } else if (response.data.type === "customer_info_status" && response.data.status === "denied") {
        dispatch(Action.failedKYC(response.data as WithdrawalKYCStatusResponse<"denied">))
        stopKYCPolling()
      } else {
        throw Error(`Unexpected response type: ${response.type} / ${response.data.type}`)
      }
    }
  }

  const handleWithdrawalFormSubmission = async (
    transferServer: TransferServer,
    asset: Asset,
    method: string,
    formValues: { [fieldName: string]: string }
  ) => {
    try {
      const withdrawalRequest: WithdrawalRequestData = {
        account: props.account.publicKey,
        asset,
        withdrawalFormValues: formValues,
        method,
        transferServer
      }
      setWithdrawalRequestPending(true)
      const webauthMetadata = await WebAuth.fetchWebAuthData(props.horizon, asset.getIssuer())

      if (webauthMetadata) {
        const webauth = {
          ...webauthMetadata,
          transaction: await WebAuth.fetchChallenge(
            webauthMetadata.endpointURL,
            webauthMetadata.signingKey,
            props.account.publicKey
          )
        }
        const cachedAuthToken = WebAuth.getCachedAuthToken(webauthMetadata.endpointURL, props.account.publicKey)
        dispatch(Action.saveInitFormData(transferServer, asset, method, formValues, webauth))

        if (cachedAuthToken) {
          dispatch(Action.setAuthToken(cachedAuthToken))
          await requestWithdrawal(withdrawalRequest, cachedAuthToken)
        }
      } else {
        dispatch(Action.saveInitFormData(transferServer, asset, method, formValues, undefined))
        await requestWithdrawal(withdrawalRequest)
      }
    } catch (error) {
      trackError(error)
    } finally {
      setWithdrawalRequestPending(false)
    }
  }

  const performWebAuthentication = async (
    details: BeforeWebauthState["details"],
    webauthData: WebauthData & { transaction: Transaction },
    password: string | null
  ) => {
    try {
      const withdrawalRequest: WithdrawalRequestData = {
        ...details,
        account: props.account.publicKey
      }
      const transaction = await signTransaction(webauthData.transaction, props.account, password)
      const authToken = await WebAuth.postResponse(webauthData.endpointURL, transaction)
      dispatch(Action.setAuthToken(authToken))
      await requestWithdrawal(withdrawalRequest, authToken)
    } catch (error) {
      // tslint:disable-next-line no-console
      console.error(error)
      trackError(Error("Web authentication failed"))
    }
  }

  const requestWithdrawal = async (withdrawalRequest: WithdrawalRequestData, authToken?: string) => {
    try {
      setWithdrawalResponsePending(true)
      handleWithdrawalRequest(await sendWithdrawalRequest(withdrawalRequest, authToken))
      startKYCPolling(() => pollKYCStatus(withdrawalRequest, authToken))
    } catch (error) {
      trackError(error)
    } finally {
      setWithdrawalResponsePending(false)
    }
  }

  const pollKYCStatus = async (request: WithdrawalRequestData, authToken?: string) => {
    if (window.navigator.onLine !== false) {
      const response = await sendWithdrawalRequest(request, authToken)
      handleWithdrawalRequest(response)
    }
  }

  const { start: startKYCPolling, stop: stopKYCPolling } = usePolling(kycPollIntervalMs)

  const startOver = () => {
    stopKYCPolling()
    dispatch(Action.backToStart())
  }

  if (transferInfos.loading) {
    return (
      <Box margin="64px auto" textAlign="center">
        <InlineLoader />
      </Box>
    )
  } else if (withdrawableAssetCodes.length === 0) {
    return (
      <Box margin="32px 0 0" textAlign="center">
        <Typography>This account holds no withdrawable assets.</Typography>
        <Portal target={props.actionsRef.element}>
          <DialogActionsBox>
            <ActionButton
              autoFocus
              onClick={() => router.history.push(routes.manageAccountAssets(props.account.id))}
              type="primary"
            >
              Add asset
            </ActionButton>
          </DialogActionsBox>
        </Portal>
      </Box>
    )
  }

  if (currentState.step === "after-successful-kyc") {
    return (
      <WithdrawalTransactionForm
        account={props.account}
        actionsRef={props.actionsRef}
        anchorResponse={currentState.withdrawal}
        asset={currentState.details.asset}
        onCancel={startOver}
        onSubmit={sendWithdrawalTx}
      />
    )
  } else if (currentState.step === "before-interactive-kyc") {
    return <WithdrawalKYCRedirect meta={currentState.kyc} onCancel={startOver} />
  } else if (currentState.step === "pending-kyc") {
    return <WithdrawalKYCStatus meta={currentState.kycStatus} onCancel={startOver} />
  } else if (
    currentState.step === "initial" ||
    currentState.step === "before-webauth" ||
    currentState.step === "after-webauth"
  ) {
    const webauth = currentState.step === "before-webauth" && currentState.webauth ? currentState.webauth : undefined
    return (
      <>
        <AnchorWithdrawalInitForm
          assets={props.assets}
          actionsRef={props.actionsRef}
          initialAsset={currentState.details && currentState.details.asset}
          initialFormValues={currentState.details && currentState.details.withdrawalFormValues}
          initialMethod={currentState.details && currentState.details.method}
          onCancel={props.onCancel}
          onSubmit={handleWithdrawalFormSubmission}
          testnet={props.testnet}
          pendingAnchorCommunication={withdrawalRequestPending || withdrawalResponsePending}
        />
        <TransactionReviewDialog
          account={props.account}
          open={Boolean(currentState.step === "before-webauth" && webauth)}
          onClose={startOver}
          onSubmitTransaction={
            currentState.step === "before-webauth" && webauth
              ? (tx, { password }) => performWebAuthentication(currentState.details, webauth, password)
              : doNothing
          }
          showSubmissionProgress={false}
          transaction={webauth ? webauth.transaction : null}
        />
      </>
    )
  } else {
    // tslint:disable-next-line no-console
    console.error("Unhandled offramp state:", currentState.step)
    return (
      <Box textAlign="center">
        The anchor responsible for this operation sent a response that Solar doesn't know how to act on :(
      </Box>
    )
  }
}

export default React.memo(Offramp)
