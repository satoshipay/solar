import React from "react"
import Dialog from "@material-ui/core/Dialog"
import Fade from "@material-ui/core/Fade"
import Typography from "@material-ui/core/Typography"
import { makeStyles } from "@material-ui/core/styles"
import { useDialogActions, useIsMobile } from "../../hooks/userinterface"
import { breakpoints, CompactDialogTransition } from "../../theme"
import DialogBody from "../Dialog/DialogBody"
import { ActionButton, DialogActionsBox } from "../Dialog/Generic"
import Portal from "../Portal"

const useLegalConfirmationStyles = makeStyles({
  root: {
    [breakpoints.down(600)]: {
      zIndex: 1400
    }
  },
  dialogPaper: {
    [breakpoints.down(600)]: {
      alignSelf: "flex-end",
      background: "rgba(255, 255, 255, 0.9)",
      margin: "0 20px 120px"
    }
  }
})

interface Props {
  message: React.ReactNode
  onClose: () => void
  onConfirm: () => void
  open: boolean
}

function LegalConfirmation(props: Props) {
  const classes = useLegalConfirmationStyles()
  const dialogActionsRef = useDialogActions()
  const isSmallScreen = useIsMobile()

  const actions = React.useMemo(
    () => (
      <DialogActionsBox className={classes.root} smallDialog transparent>
        <Fade enter={isSmallScreen} exit={isSmallScreen} in={props.open}>
          <ActionButton onClick={props.onConfirm} type="primary">
            I understand
          </ActionButton>
        </Fade>
      </DialogActionsBox>
    ),
    [classes.root, isSmallScreen, props.onConfirm, props.open]
  )

  return (
    <Dialog
      classes={{
        paper: classes.dialogPaper
      }}
      onClose={props.onClose}
      open={props.open}
      TransitionComponent={CompactDialogTransition}
    >
      <DialogBody actions={dialogActionsRef} preventActionsPlaceholder preventNotch>
        <Typography color="textSecondary">{props.message}</Typography>
      </DialogBody>
      <Portal target={isSmallScreen ? document.body : dialogActionsRef.element}>{actions}</Portal>
    </Dialog>
  )
}

export default React.memo(LegalConfirmation)
