import BigNumber from "big.js"
import React from "react"
import { Asset } from "stellar-sdk"
import SendIcon from "@material-ui/icons/Send"
import { TransferServer, WithdrawalRequestKYC, WithdrawalRequestSuccess } from "@satoshipay/sep-6"
import { ActionButton, DialogActionsBox } from "../Dialog/Generic"
import { HorizontalLayout, VerticalLayout } from "../Layout/Box"

interface ExtraValues {
  [fieldName: string]: string
}

interface Props {
  anchorResponse: WithdrawalRequestKYC | WithdrawalRequestSuccess
  onCancel: () => void
  onSubmit: (transferServer: TransferServer, asset: Asset, amount: BigNumber, extraFields: ExtraValues) => void
  testnet: boolean
}

function AnchorWithdrawalFinishForm(props: Props) {
  const handleSubmit = () => {
    // FIXME
  }

  // FIXME
  const isDisabled = true

  return (
    <form onSubmit={handleSubmit}>
      <VerticalLayout>
        <HorizontalLayout>
          {/* https://satoshipay.slack.com/files/U9S4JUAAF/FGKL0L75L/10_withdraw_2.png */}
        </HorizontalLayout>
        <HorizontalLayout margin="24px 0 0">{null}</HorizontalLayout>
        <DialogActionsBox spacing="large" style={{ marginTop: 64 }}>
          <ActionButton onClick={props.onCancel}>Cancel</ActionButton>
          <ActionButton disabled={isDisabled} icon={<SendIcon />} onClick={() => undefined} type="submit">
            Withdraw
          </ActionButton>
        </DialogActionsBox>
      </VerticalLayout>
    </form>
  )
}

export default AnchorWithdrawalFinishForm
