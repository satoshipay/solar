import React from "react"
import Button from "@material-ui/core/Button"
import Typography from "@material-ui/core/Typography"
import { VerticalLayout } from "../Layout/Box"
import { WithdrawalStates } from "./statemachine"
import { Paragraph, Summary } from "./Sidebar"

interface WithdrawalSuccessProps {
  onClose: () => void
  state: WithdrawalStates.WithdrawalCompleted
}

function WithdrawalSuccess(props: WithdrawalSuccessProps) {
  const { transferServer } = props.state.withdrawal
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
        <Button color="primary" onClick={props.onClose} variant="contained">
          Close
        </Button>
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
