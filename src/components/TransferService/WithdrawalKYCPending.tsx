import React from "react"
import Button from "@material-ui/core/Button"
import CircularProgress from "@material-ui/core/CircularProgress"
import Typography from "@material-ui/core/Typography"
import { trackError } from "../../context/notifications"
import { openLink } from "../../platform/links"
import { Box, VerticalLayout } from "../Layout/Box"
import { WithdrawalStates } from "./statemachine"
import { Paragraph, Summary } from "./Sidebar"
import TransferTransactionStatus from "./TransferTransactionStatus"
import { WithdrawalContext } from "./WithdrawalProvider"

interface WithdrawalKYCPendingProps {
  state: WithdrawalStates.KYCPending
}

function WithdrawalKYCPending(props: WithdrawalKYCPendingProps) {
  const { response } = props.state
  const { transferServer } = props.state.withdrawal
  const { actions } = React.useContext(WithdrawalContext)

  const handleSubmit = (event: React.SyntheticEvent) => {
    event.preventDefault()
    actions.didRedirectToKYC()

    if (response.data.type === "interactive_customer_info_needed") {
      openLink(response.data.url)
    } else {
      trackError(Error("Only interactive KYCs are supported."))
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit}>
      <VerticalLayout grow>
        <VerticalLayout alignItems="center" margin="24px auto" textAlign="center">
          <Typography variant="h5">Additional information needed</Typography>
          <TransferTransactionStatus domain={transferServer.domain} transaction={props.state.transfer} />
          {props.state.didRedirect ? (
            <Box grow margin="48px 0" textAlign="center">
              <CircularProgress />
            </Box>
          ) : null}
          <Button color="primary" type="submit" variant="contained">
            {props.state.didRedirect ? "Open again" : "Continue"}
          </Button>
        </VerticalLayout>
      </VerticalLayout>
    </form>
  )
}

const Sidebar = () => (
  <Summary headline="Know Your Customer">
    <Paragraph>The withdrawal service will only work if you provide personal information about you.</Paragraph>
    <Paragraph>This usually happens for legal reasons.</Paragraph>
  </Summary>
)

const KYCPendingView = Object.assign(React.memo(WithdrawalKYCPending), { Sidebar })

export default KYCPendingView
