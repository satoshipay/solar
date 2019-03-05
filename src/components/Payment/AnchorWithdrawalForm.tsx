import React from "react"
import { Asset, Server, Transaction } from "stellar-sdk"
import Button from "@material-ui/core/Button"
import Typography from "@material-ui/core/Typography"
import { TransferServer, WithdrawalRequestKYC, WithdrawalRequestSuccess } from "@satoshipay/sep-6"
import { Account } from "../../context/accounts"
import { trackError } from "../../context/notifications"
import { useRouter } from "../../hooks"
import * as routes from "../../routes"
import { ActionButton, DialogActionsBox } from "../Dialog/Generic"
import InlineLoader from "../InlineLoader"
import { Box } from "../Layout/Box"
import { useAssetTransferServerInfos } from "./hooks"
import AnchorWithdrawalFinishForm from "./AnchorWithdrawalFinishForm"
import AnchorWithdrawalInitForm from "./AnchorWithdrawalInitForm"

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
  Actions: React.ComponentType<{ disabled?: boolean; onSubmit: () => void }>
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
  const transferInfos = useAssetTransferServerInfos(props.assets, props.testnet)

  const withdrawableAssetCodes = Object.keys(transferInfos.data).filter(assetCode => {
    const transferInfo = transferInfos.data[assetCode]
    return transferInfo.withdraw && transferInfo.withdraw.enabled
  })

  const createWithdrawalTx = async () => {
    // FIXME
    debugger
    return new Transaction("")
  }

  const sendWithdrawalTx = () => {
    props.onSubmit(createWithdrawalTx)
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
      setWithdrawalResponse(response)
    } catch (error) {
      trackError(error)
    } finally {
      setWithdrawalResponsePending(false)
    }
  }

  const Actions = React.useCallback(
    (actionProps: { disabled?: boolean; onSubmit: () => void }) => (
      <DialogActionsBox spacing="large" style={{ marginTop: 64 }}>
        <ActionButton onClick={props.onCancel}>Cancel</ActionButton>
        <ActionButton
          disabled={actionProps.disabled}
          loading={withdrawalResponsePending}
          onClick={actionProps.onSubmit}
          type="submit"
        >
          Proceed
        </ActionButton>
      </DialogActionsBox>
    ),
    []
  )

  if (transferInfos.loading) {
    return (
      <Box margin="64px auto" textAlign="center">
        <InlineLoader />
      </Box>
    )
  } else if (withdrawableAssetCodes.length === 0) {
    return <NoWithdrawableAssets account={props.account} />
  }

  return withdrawalResponse ? (
    <AnchorWithdrawalFinishForm
      Actions={props.Actions}
      assets={props.assets}
      onSubmit={sendWithdrawalTx}
      testnet={props.testnet}
    />
  ) : (
    <AnchorWithdrawalInitForm
      Actions={Actions}
      assets={props.assets}
      onSubmit={requestWithdrawal}
      testnet={props.testnet}
    />
  )
}

export default AnchorWithdrawalForm
