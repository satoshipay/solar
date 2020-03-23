import React from "react"
import Typography from "@material-ui/core/Typography"
import { Withdrawal } from "@satoshipay/stellar-transfer"
import { RefStateObject } from "../../Generic/hooks/userinterface"
import { ActionButton, DialogActionsBox } from "../../Dialog/components/Generic"
import { VerticalLayout } from "../../Layout/components/Box"
import Portal from "../../Generic/components/Portal"
import { TransferStates } from "../util/statemachine"
import { Paragraph, Summary } from "./Sidebar"

interface WithdrawalSuccessProps {
  dialogActionsRef: RefStateObject | undefined
  onClose: () => void
  state: TransferStates.TransferCompleted<Withdrawal>
}

function WithdrawalSuccess(props: WithdrawalSuccessProps) {
  const { transferServer } = props.state.withdrawal!
  return (
    <VerticalLayout grow>
      <VerticalLayout alignItems="center" margin="24px 0" textAlign="center">
        <Typography variant="h5">Withdrawal in progress</Typography>
        <Typography style={{ margin: "16px 0" }} variant="body2">
          <Typography style={{ margin: "8px 0" }} variant="body2">
            {transferServer.domain} is conducting the withdrawal.
          </Typography>
          <Typography style={{ margin: "8px 0" }} variant="body2">
            The funds have been deducted from your Stellar account and should be credited to the withdrawal destination
            shortly.
          </Typography>
          {/* TODO: Show nice summary */}
        </Typography>
        <Portal desktop="inline" target={props.dialogActionsRef && props.dialogActionsRef.element}>
          <DialogActionsBox>
            <ActionButton onClick={props.onClose} type="primary">
              Close
            </ActionButton>
          </DialogActionsBox>
        </Portal>
      </VerticalLayout>
    </VerticalLayout>
  )
}

const Sidebar = () => (
  <Summary headline="Done">
    <Paragraph>Your withdrawal has been accepted and will be processed by the asset issuer.</Paragraph>
  </Summary>
)

const SuccessView = Object.assign(React.memo(WithdrawalSuccess), { Sidebar })

export default SuccessView
