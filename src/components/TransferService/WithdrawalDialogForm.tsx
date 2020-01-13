import BigNumber from "big.js"
import React from "react"
import { Asset, Operation, Server, Transaction } from "stellar-sdk"
import Typography from "@material-ui/core/Typography"
import { WithdrawalSuccessResponse } from "@satoshipay/stellar-sep-6"
import { Account } from "../../context/accounts"
import { useLiveAccountData } from "../../hooks/stellar-subscriptions"
import { useRouter, RefStateObject } from "../../hooks/userinterface"
import { createTransaction } from "../../lib/transaction"
import * as routes from "../../routes"
import { ActionButton, DialogActionsBox } from "../Dialog/Generic"
import InlineLoader from "../InlineLoader"
import { Box } from "../Layout/Box"
import Portal from "../Portal"
import TransactionReviewDialog from "../TransactionReview/TransactionReviewDialog"
import WithdrawalKYCRedirect from "./WithdrawalKYCRedirect"
import TransferTransactionStatus from "./TransferTransactionStatus"
import WithdrawalRequestForm from "./WithdrawalRequestForm"
import WithdrawalTransactionForm from "./WithdrawalTransactionForm"
import { useAssetTransferServerInfos } from "./transferservice"
import { createMemo } from "./util"
import { useWithdrawalState } from "./withdraw"

const doNothing = () => undefined

interface Props {
  account: Account
  actionsRef: RefStateObject
  assets: Asset[]
  horizon: Server
  onSubmit: (createTx: () => Promise<Transaction>) => Promise<any>
  testnet: boolean
}

function WithdrawalDialogForm(props: Props) {
  const router = useRouter()
  const { actions, state, withdrawalRequestPending, withdrawalResponsePending } = useWithdrawalState(props.account)

  const accountData = useLiveAccountData(props.account.publicKey, props.account.testnet)
  const transferInfos = useAssetTransferServerInfos(props.assets, props.testnet)

  const withdrawableAssets = props.assets.filter(asset => {
    const data = transferInfos.data.get(asset)
    return data && data.transferInfo.withdraw && data.transferInfo.withdraw.enabled
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

  if (transferInfos.loading) {
    return (
      <Box margin="64px auto" textAlign="center">
        <InlineLoader />
      </Box>
    )
  } else if (withdrawableAssets.length === 0) {
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

  if (state.step === "after-successful-kyc") {
    return (
      <WithdrawalTransactionForm
        account={props.account}
        actionsRef={props.actionsRef}
        anchorResponse={state.transfer}
        asset={state.details.asset}
        onCancel={actions.startOver}
        onSubmit={sendWithdrawalTx}
      />
    )
  } else if (state.step === "before-interactive-kyc") {
    return <WithdrawalKYCRedirect meta={state.kyc} onCancel={actions.startOver} />
  } else if (state.step === "pending-kyc") {
    return <TransferTransactionStatus onCancel={actions.startOver} transaction={state.transaction} />
  } else if (state.step === "initial" || state.step === "before-webauth" || state.step === "after-webauth") {
    const webauth = state.step === "before-webauth" && state.webauth ? state.webauth : undefined
    return (
      <>
        <WithdrawalRequestForm
          assets={props.assets}
          actionsRef={props.actionsRef}
          initialAsset={state.details && state.details.asset}
          initialFormValues={state.details && state.details.formValues}
          initialMethod={state.details && state.details.method}
          onSubmit={actions.handleWithdrawalFormSubmission}
          pendingAnchorCommunication={withdrawalRequestPending || withdrawalResponsePending}
          testnet={props.testnet}
          withdrawableAssets={withdrawableAssets}
        />
        <TransactionReviewDialog
          account={props.account}
          open={Boolean(state.step === "before-webauth" && webauth)}
          onClose={actions.startOver}
          onSubmitTransaction={
            state.step === "before-webauth" && webauth
              ? (tx, { password }) => actions.performWebAuthentication(state.details, webauth, password)
              : doNothing
          }
          showSubmissionProgress={false}
          transaction={webauth ? webauth.transaction : null}
        />
      </>
    )
  } else {
    throw Error("The anchor responsible for this operation sent a response that Solar doesn't know how to act on :(")
  }
}

export default React.memo(WithdrawalDialogForm)
