import BigNumber from "big.js"
import React from "react"
import { Asset, Server, Transaction } from "stellar-sdk"
import Button from "@material-ui/core/Button"
import Typography from "@material-ui/core/Typography"
import { TransferServer, WithdrawalRequestKYC, WithdrawalRequestSuccess } from "@satoshipay/sep-6"
import { Account } from "../../context/accounts"
import { trackError } from "../../context/notifications"
import { useRouter } from "../../hooks"
import * as routes from "../../routes"
import InlineLoader from "../InlineLoader"
import { Box } from "../Layout/Box"
import { useAssetTransferServerInfos } from "./hooks"
import AnchorWithdrawalFinishForm from "./AnchorWithdrawalFinishForm"
import AnchorWithdrawalInitForm from "./AnchorWithdrawalInitForm"
import AnchorWithdrawalKYCForm from "./AnchorWithdrawalKYCForm"

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

interface Props {
  account: Account
  assets: Asset[]
  horizon: Server
  onCancel: () => void
  onSubmit: (createTx: () => Promise<Transaction>) => any
  testnet: boolean
}

function AnchorWithdrawalForm(props: Props) {
  const [withdrawalResponse, setWithdrawalResponse] = React.useState<
    WithdrawalRequestKYC | WithdrawalRequestSuccess | null
  >(null)
  const [withdrawalResponsePending, setWithdrawalResponsePending] = React.useState(false)
  const [selectedAsset, setSelectedAsset] = React.useState<Asset | null>(null)
  const transferInfos = useAssetTransferServerInfos(props.assets, props.testnet)

  const withdrawableAssetCodes = Object.keys(transferInfos.data).filter(assetCode => {
    const transferInfo = transferInfos.data[assetCode].transferInfo
    return transferInfo.withdraw && transferInfo.withdraw.enabled
  })

  const createWithdrawalTx = async (amount: BigNumber) => {
    // FIXME
    debugger
    return new Transaction("")
  }

  const sendWithdrawalTx = (amount: BigNumber) => {
    props.onSubmit(() => createWithdrawalTx(amount))
  }

  const requestWithdrawal = async (
    transferServer: TransferServer,
    asset: Asset,
    method: string,
    formValues: { [fieldName: string]: string }
  ) => {
    try {
      setWithdrawalResponsePending(true)
      if (!formValues.dest) {
        throw new Error("")
      }
      const response = await transferServer.withdraw(method, asset.getCode(), {
        account: props.account.publicKey,
        ...formValues
      } as any)
      setSelectedAsset(asset)
      setWithdrawalResponse(response)
    } catch (error) {
      trackError(error)
    } finally {
      setWithdrawalResponsePending(false)
    }
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
        onCancel={props.onCancel}
        onSubmit={sendWithdrawalTx}
      />
    )
  } else if (withdrawalResponse && withdrawalResponse.type === "kyc") {
    // FIXME: Poll until KYC done
    return <AnchorWithdrawalKYCForm anchorResponse={withdrawalResponse} onCancel={props.onCancel} />
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
