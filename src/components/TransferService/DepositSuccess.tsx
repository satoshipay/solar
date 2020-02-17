import React from "react"
import Typography from "@material-ui/core/Typography"
import { Deposit } from "@satoshipay/stellar-transfer"
import { RefStateObject } from "../../hooks/userinterface"
import { ActionButton, DialogActionsBox } from "../Dialog/Generic"
import { VerticalLayout } from "../Layout/Box"
import Portal from "../Portal"
import { TransferStates } from "./statemachine"
import { Paragraph, Summary } from "./Sidebar"

interface DepositSuccessProps {
  dialogActionsRef: RefStateObject | undefined
  onClose: () => void
  state: TransferStates.TransferCompleted<Deposit>
}

function DepositSuccess(props: DepositSuccessProps) {
  const { transferServer } = props.state.deposit!
  return (
    <VerticalLayout grow>
      <VerticalLayout alignItems="center" margin="24px 0" textAlign="center">
        <Typography variant="h5">Deposit pending</Typography>
        <Typography style={{ margin: "16px 0" }} variant="body2">
          <Typography style={{ margin: "8px 0" }} variant="body2">
            {transferServer.domain} is waiting for your deposit.
          </Typography>
          <Typography style={{ margin: "8px 0" }} variant="body2">
            The funds will be credited to your Stellar account when the deposit is credited to the asset issuer.
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
    <Paragraph>
      Your deposit has been accepted and will be processed by the asset issuer when your payment arrives.
    </Paragraph>
  </Summary>
)

const SuccessView = Object.assign(React.memo(DepositSuccess), { Sidebar })

export default SuccessView
