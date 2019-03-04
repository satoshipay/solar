import React from "react"
import { Asset, Server, Transaction } from "stellar-sdk"
import { TransferServer, WithdrawalRequestKYC, WithdrawalRequestSuccess } from "@satoshipay/sep-6"
import { Account } from "../../context/accounts"
import { trackError } from "../../context/notifications"
import { ActionButton, DialogActionsBox } from "../Dialog/Generic"
import AnchorWithdrawalFinishForm from "./AnchorWithdrawalFinishForm"
import AnchorWithdrawalInitForm from "./AnchorWithdrawalInitForm"

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
