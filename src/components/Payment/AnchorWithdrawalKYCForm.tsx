import React from "react"
import Button from "@material-ui/core/Button"
import Typography from "@material-ui/core/Typography"
import ChevronLeftIcon from "@material-ui/icons/ChevronLeft"
import { WithdrawalKYCInteractiveResponse, WithdrawalRequestKYC } from "@satoshipay/sep-6"
import ButtonIconLabel from "../ButtonIconLabel"
import { Box, VerticalLayout } from "../Layout/Box"
import AnchorWithdrawalKYCStatus from "./AnchorWithdrawalKYCStatus"

interface KYCRedirectProps {
  meta: WithdrawalKYCInteractiveResponse
  onCancel: () => void
  onRedirect?: () => void
}

function AnchorWithdrawalKYCRedirect(props: KYCRedirectProps) {
  const handleSubmit = (event: React.SyntheticEvent) => {
    event.preventDefault()
    window.open(props.meta.url, "_blank")

    if (props.onRedirect) {
      props.onRedirect()
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <VerticalLayout grow>
        <VerticalLayout alignItems="center" margin="48px auto 0" maxWidth="500px" textAlign="center" width="80%">
          <Typography variant="h5">Additional information needed</Typography>
          <Typography style={{ margin: "8px 0 24px" }} variant="body2">
            The anchor responsible for this operation requires that you provide additional information before accessing
            the service.
          </Typography>
          <Button color="primary" type="submit" variant="raised">
            Continue
          </Button>
        </VerticalLayout>
        <Box grow margin="24px 0 64px">
          {null}
        </Box>
        <Box>
          <Button variant="text">
            <ButtonIconLabel label="Back" style={{ paddingRight: 8 }}>
              <ChevronLeftIcon />
            </ButtonIconLabel>
          </Button>
        </Box>
      </VerticalLayout>
    </form>
  )
}

interface Props {
  anchorResponse: WithdrawalRequestKYC
  onCancel: () => void
  onRedirect?: () => void
}

function AnchorWithdrawalKYCForm(props: Props) {
  if (props.anchorResponse.data.type === "interactive_customer_info_needed") {
    return (
      <AnchorWithdrawalKYCRedirect
        meta={props.anchorResponse.data}
        onCancel={props.onCancel}
        onRedirect={props.onRedirect}
      />
    )
  } else if (props.anchorResponse.data.type === "non_interactive_customer_info_needed") {
    // TODO: Implement non-interactive KYC
    return (
      <Box textAlign="center">
        The anchor responsible for this operation sent a response that Solar doesn't know how to act on :(
      </Box>
    )
  } else if (props.anchorResponse.data.type === "customer_info_status") {
    return <AnchorWithdrawalKYCStatus meta={props.anchorResponse.data} onCancel={props.onCancel} />
  } else {
    throw new Error("Anchor response not supported.")
  }
}

export default AnchorWithdrawalKYCForm
