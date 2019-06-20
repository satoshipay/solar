import React from "react"
import Typography from "@material-ui/core/Typography"
import CheckIcon from "@material-ui/icons/Check"
import CloseIcon from "@material-ui/icons/Close"
import { useIsMobile } from "../../hooks"
import { Box, VerticalLayout, HorizontalLayout } from "../Layout/Box"
import { DialogActionsBox, ActionButton } from "./Generic"
import StellarGuardIcon from "../Icon/StellarGuard"

interface Props {
  onClose: () => void
}

function StellarGuardActivationDialog(props: Props) {
  const isSmallScreen = useIsMobile()

  return (
    <>
      <Box width="100%" maxWidth={900} padding={isSmallScreen ? "24px" : " 24px 32px"} margin="0 auto 32px">
        <HorizontalLayout>
          <Typography variant="h6" style={{ flexGrow: 1 }}>
            Activate two-factor authentication
          </Typography>
          <StellarGuardIcon style={{ color: "blue" }} />
        </HorizontalLayout>
        <Typography variant="body1" style={{ marginTop: 8 }}>
          To add two-factor authentication to your account you need to share your public key with StellarGuard.
          <br />
          Don't worry, StellarGuard is a verified partner of ours.
        </Typography>
      </Box>
      <VerticalLayout justifyContent="center" alignItems="center">
        <Typography align="center" style={{ marginBottom: 12 }}>
          Select the account to which you want to add two-factor authentication:
        </Typography>
        ** Imagine AccountSelectionList **
      </VerticalLayout>
      <DialogActionsBox>
        <ActionButton icon={<CloseIcon />} onClick={props.onClose}>
          Cancel
        </ActionButton>
        <ActionButton autoFocus icon={<CheckIcon />} onClick={undefined} type="primary">
          Share my public key
        </ActionButton>
      </DialogActionsBox>
    </>
  )
}

export default StellarGuardActivationDialog
