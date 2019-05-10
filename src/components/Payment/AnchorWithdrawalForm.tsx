import BigNumber from "big.js"
import { Buffer } from "buffer"
import React from "react"
import { Asset, Memo, Operation, Server, Transaction } from "stellar-sdk"
import Button from "@material-ui/core/Button"
import Typography from "@material-ui/core/Typography"
import { TransferServer, WithdrawalRequestKYC, WithdrawalRequestSuccess } from "@satoshipay/stellar-sep-6"
import { Account } from "../../context/accounts"
import { trackError } from "../../context/notifications"
import { useAccountData, useRouter } from "../../hooks"
import { createTransaction } from "../../lib/transaction"
import * as routes from "../../routes"
import InlineLoader from "../InlineLoader"
import { Box } from "../Layout/Box"
import { useAssetTransferServerInfos, usePolling } from "./hooks"
import AnchorWithdrawalFinishForm from "./AnchorWithdrawalFinishForm"
import AnchorWithdrawalInitForm from "./AnchorWithdrawalInitForm"
import AnchorWithdrawalKYCForm from "./AnchorWithdrawalKYCForm"

const kycPollIntervalMs = 6000

function createMemo(withdrawalResponse: WithdrawalRequestSuccess): Memo | null {
  const { memo, memo_type: type } = withdrawalResponse.data

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

function sendWithdrawalRequest(request: WithdrawalRequestData) {
  const { account, asset, formValues, method, transferServer } = request
  return transferServer.withdraw(method, asset.getCode(), { account, ...formValues } as any)
}

function NoWithdrawableAssets(props: { account: Account }) {
  const router = useRouter()
  return (
    <Box margin="48px 0 0" textAlign="center">
      <Typography>This account holds no withdrawable assets.</Typography>
      <Box margin="24px 0 0">
        <Button onClick={() => router.history.push(routes.manageAccountAssets(props.account.id))} variant="outlined">
          Add another asset
        </Button>
      </Box>
    </Box>
  )
}

interface WithdrawalRequestData {
  account: string
  asset: Asset
  method: string
  formValues: { [fieldName: string]: string }
  transferServer: TransferServer
}

interface Props {
  account: Account
  assets: Asset[]
  horizon: Server
  onCancel: () => void
  onSubmit: (createTx: () => Promise<Transaction>) => Promise<any>
  testnet: boolean
}

function AnchorWithdrawalForm(props: Props) {
  const [withdrawalResponse, setWithdrawalResponse] = React.useState<
    WithdrawalRequestKYC | WithdrawalRequestSuccess | null
  >(null)
  const [selectedAsset, setSelectedAsset] = React.useState<Asset | null>(null)
  const [withdrawalResponsePending, setWithdrawalResponsePending] = React.useState(false)
  const router = useRouter()

  const accountData = useAccountData(props.account.publicKey, props.account.testnet)
  const transferInfos = useAssetTransferServerInfos(props.assets, props.testnet)

  const withdrawableAssetCodes = Object.keys(transferInfos.data).filter(assetCode => {
    const transferInfo = transferInfos.data[assetCode].transferInfo
    return transferInfo.withdraw && transferInfo.withdraw.enabled
  })

  const createWithdrawalTx = async (amount: BigNumber, asset: Asset, response: WithdrawalRequestSuccess) => {
    const memo = createMemo(response)
    const payment = Operation.payment({
      amount: amount.toString(),
      asset,
      destination: response.data.account_id
    })
    return createTransaction([payment], {
      accountData,
      horizon: props.horizon,
      memo,
      walletAccount: props.account
    })
  }

  const sendWithdrawalTx = async (amount: BigNumber, asset: Asset, response: WithdrawalRequestSuccess) => {
    await props.onSubmit(() => createWithdrawalTx(amount, asset, response))
    router.history.push(routes.account(props.account.id))
  }

  const requestWithdrawal = async (
    transferServer: TransferServer,
    asset: Asset,
    method: string,
    formValues: { [fieldName: string]: string }
  ) => {
    try {
      const newWithdrawalRequest: WithdrawalRequestData = {
        account: props.account.publicKey,
        asset,
        formValues,
        method,
        transferServer
      }
      setSelectedAsset(asset)
      setWithdrawalResponsePending(true)
      const response = await sendWithdrawalRequest(newWithdrawalRequest)
      setWithdrawalResponse(response)
      startKYCPolling(() => pollKYCStatus(newWithdrawalRequest))
    } catch (error) {
      trackError(error)
    } finally {
      setWithdrawalResponsePending(false)
    }
  }

  const pollKYCStatus = async (request: WithdrawalRequestData) => {
    if (window.navigator.onLine !== false) {
      const response = await sendWithdrawalRequest(request)
      setWithdrawalResponse(response)

      const kycDenied =
        response.type === "kyc" && response.data.type === "customer_info_status" && response.data.status === "denied"
      if (response.type === "success" || kycDenied) {
        stopKYCPolling()
      }
    }
  }

  const { start: startKYCPolling, stop: stopKYCPolling } = usePolling(kycPollIntervalMs)

  const startOver = () => {
    stopKYCPolling()
    setWithdrawalResponse(null)
    setWithdrawalResponsePending(false)
  }

  if (transferInfos.loading) {
    return (
      <Box margin="64px auto" textAlign="center">
        <InlineLoader />
      </Box>
    )
  } else if (withdrawableAssetCodes.length === 0) {
    return <NoWithdrawableAssets account={props.account} />
  }

  if (withdrawalResponse && withdrawalResponse.type === "success") {
    if (!selectedAsset) {
      throw new Error("No asset set.")
    }
    return (
      <AnchorWithdrawalFinishForm
        account={props.account}
        asset={selectedAsset}
        anchorResponse={withdrawalResponse}
        onCancel={startOver}
        onSubmit={sendWithdrawalTx}
      />
    )
  } else if (withdrawalResponse && withdrawalResponse.type === "kyc") {
    return <AnchorWithdrawalKYCForm anchorResponse={withdrawalResponse} onCancel={startOver} />
  } else {
    return (
      <AnchorWithdrawalInitForm
        assets={props.assets}
        onCancel={props.onCancel}
        onSubmit={requestWithdrawal}
        testnet={props.testnet}
        withdrawalResponsePending={withdrawalResponsePending}
      />
    )
  }
}

export default AnchorWithdrawalForm
