import React from "react"
import Button from "@material-ui/core/Button"
import CircularProgress from "@material-ui/core/CircularProgress"
import Typography from "@material-ui/core/Typography"
import ChevronLeftIcon from "@material-ui/icons/ChevronLeft"
import { KYCInteractiveResponse } from "@satoshipay/stellar-sep-6"
import { openLink } from "../../platform/links"
import ButtonIconLabel from "../ButtonIconLabel"
import { Box, VerticalLayout } from "../Layout/Box"

interface KYCRedirectProps {
  meta: KYCInteractiveResponse
  onCancel: () => void
  onRedirect?: () => void
}

function WithdrawalKYCRedirect(props: KYCRedirectProps) {
  const [isPending, setPending] = React.useState(false)

  const handleSubmit = (event: React.SyntheticEvent) => {
    event.preventDefault()
    openLink(props.meta.url)

    setPending(true)
    if (props.onRedirect) {
      props.onRedirect()
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit}>
      <VerticalLayout grow>
        <VerticalLayout alignItems="center" margin="48px auto 0" maxWidth="500px" textAlign="center" width="80%">
          <Typography variant="h5">Additional information needed</Typography>
          <Typography style={{ margin: "8px 0 24px" }} variant="body2">
            The anchor responsible for this operation requires that you provide additional information before accessing
            the service.
          </Typography>
          <Button color="primary" type="submit" variant="contained">
            {isPending ? "Open again" : "Continue"}
          </Button>
        </VerticalLayout>
        <Box grow margin="48px 0 40px" textAlign="center">
          {isPending ? <CircularProgress /> : null}
        </Box>
        <Box>
          <Button onClick={props.onCancel} variant="text">
            <ButtonIconLabel label="Back" style={{ paddingRight: 8 }}>
              <ChevronLeftIcon />
            </ButtonIconLabel>
          </Button>
        </Box>
      </VerticalLayout>
    </form>
  )
}

export default WithdrawalKYCRedirect
