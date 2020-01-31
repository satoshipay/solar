import React from "react"
import Button from "@material-ui/core/Button"
import CircularProgress from "@material-ui/core/CircularProgress"
import Typography from "@material-ui/core/Typography"
import { trackError } from "../../context/notifications"
import { openLink } from "../../platform/links"
import { Box, VerticalLayout } from "../Layout/Box"
import { WithdrawalStates } from "./statemachine"

interface WithdrawalKYCPendingProps {
  state: WithdrawalStates.KYCPending
}

function WithdrawalKYCPending(props: WithdrawalKYCPendingProps) {
  const { response } = props.state
  const { transferServer } = props.state.withdrawal
  const [isPending, setPending] = React.useState(false)

  const handleSubmit = (event: React.SyntheticEvent) => {
    event.preventDefault()

    if (response.data.type === "interactive_customer_info_needed") {
      openLink(response.data.url)
      setPending(true)
    } else {
      trackError(Error("Only interactive KYCs are supported."))
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit}>
      <VerticalLayout grow>
        <VerticalLayout alignItems="center" margin="48px auto 0" maxWidth="500px" textAlign="center" width="80%">
          <Typography variant="h5">Additional information needed</Typography>
          <Typography style={{ margin: "16px 0 24px" }} variant="body2">
            {transferServer.domain} requires that you provide additional information before accessing the service.
          </Typography>
          <Button color="primary" type="submit" variant="contained">
            {isPending ? "Open again" : "Continue"}
          </Button>
        </VerticalLayout>
        <Box grow margin="48px 0 40px" textAlign="center">
          {isPending ? <CircularProgress /> : null}
        </Box>
      </VerticalLayout>
    </form>
  )
}

export default React.memo(WithdrawalKYCPending)
