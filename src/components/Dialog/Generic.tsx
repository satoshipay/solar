import React from "react"
import Button from "@material-ui/core/Button"
import Dialog from "@material-ui/core/Dialog"
import DialogActions from "@material-ui/core/DialogActions"
import DialogContent from "@material-ui/core/DialogContent"
import DialogTitle from "@material-ui/core/DialogTitle"
import Slide from "@material-ui/core/Slide"
import { TransitionProps } from "@material-ui/core/transitions/transition"
import Typography from "@material-ui/core/Typography"
import { makeStyles } from "@material-ui/core/styles"
import CloseIcon from "@material-ui/icons/Close"
import { useIsMobile } from "../../hooks"
import { breakpoints } from "../../theme"
import { HorizontalLayout } from "../Layout/Box"
import ButtonIconLabel from "../ButtonIconLabel"

const closeIcon = <CloseIcon />

const Transition = React.forwardRef((props: TransitionProps, ref) => <Slide ref={ref} {...props} direction="up" />)

function MaybeIcon(props: { icon?: React.ReactNode; label: React.ReactNode; loading?: boolean }) {
  return (
    <>
      <ButtonIconLabel label={props.label} loading={props.loading}>
        {props.icon}
      </ButtonIconLabel>
    </>
  )
}

const useActionButtonStyles = makeStyles({
  inlineDialogActionsBox: {
    alignItems: "stretch",
    margin: "32px 0 0",
    padding: "8px 0",

    [breakpoints.down(600)]: {
      justifyContent: "center",
      marginLeft: -12,
      marginRight: -12
    }
  },
  mobileDialogActionsBox: {
    position: "fixed",
    left: 0,
    bottom: 0,
    padding: undefined,
    width: "100%",
    background: "white",
    boxShadow: "0 0 16px 0 rgba(0, 0, 0, 0.1)",
    justifyContent: "flex-end"
  },
  actionButton: {
    "$inlineDialogActionsBox &": {
      boxShadow: "none",
      padding: "10px 20px"
    },

    "$mobileDialogActionsBox &": {
      flexGrow: 1,
      margin: 12,
      maxWidth: "calc(50% - 24px)",
      padding: "12px 16px",

      "&:first-child:last-child": {
        maxWidth: "calc(100% - 16px)"
      }
    }
  }
})

interface ActionButtonProps {
  autoFocus?: boolean
  children: React.ReactNode
  className?: string
  disabled?: boolean
  form?: string
  icon?: React.ReactNode
  loading?: boolean
  onClick?: (event: React.SyntheticEvent) => void
  style?: React.CSSProperties
  type?: "primary" | "secondary" | "submit"
}

export function ActionButton(props: ActionButtonProps) {
  const { type = "secondary" } = props
  const classes = useActionButtonStyles()
  const isSmallScreen = useIsMobile()

  return (
    <Button
      autoFocus={props.autoFocus}
      color={type === "primary" || type === "submit" ? "primary" : undefined}
      className={`${classes.actionButton} ${props.className || ""}`}
      disabled={props.disabled}
      form={props.form}
      onClick={props.onClick}
      style={props.style}
      type={type === "submit" ? "submit" : undefined}
      variant={!isSmallScreen && (props.type === "secondary" || !props.type) ? "text" : "contained"}
    >
      <MaybeIcon icon={props.icon} label={props.children} loading={props.loading} />
    </Button>
  )
}

export function CloseButton(props: { onClick?: (event: React.SyntheticEvent) => void }) {
  return (
    <ActionButton icon={closeIcon} onClick={props.onClick} type="secondary">
      Close
    </ActionButton>
  )
}

interface MobileDialogActionsBoxProps {
  children: React.ReactNode | React.ReactNode[]
  smallDialog?: boolean
}

// tslint:disable-next-line no-shadowed-variable
const MobileDialogActionsBox = React.memo(function MobileDialogActionsBox(props: MobileDialogActionsBoxProps) {
  const classes = useActionButtonStyles()
  return (
    <>
      {props.smallDialog ? null : (
        // Placeholder to prevent other dialog content from being hidden below the actions box
        // Make sure its height matches the height of the actions box
        <div style={{ width: "100%", height: 72 }} />
      )}
      <HorizontalLayout className={`iphone-notch-bottom-spacing ${classes.mobileDialogActionsBox}`}>
        {props.children}
      </HorizontalLayout>
    </>
  )
})

interface DialogActionsBoxProps {
  children: React.ReactNode | React.ReactNode[]
  desktopStyle?: React.CSSProperties
  preventMobileActionsBox?: boolean
  smallDialog?: boolean
  spacing?: "normal" | "large"
}

// tslint:disable-next-line no-shadowed-variable
export const DialogActionsBox = React.memo(function DialogActionsBox(props: DialogActionsBoxProps) {
  const classes = useActionButtonStyles()
  const isSmallScreen = useIsMobile()

  if (isSmallScreen && !props.preventMobileActionsBox) {
    return <MobileDialogActionsBox smallDialog={props.smallDialog}>{props.children}</MobileDialogActionsBox>
  }

  return (
    <DialogActions className={classes.inlineDialogActionsBox} style={props.desktopStyle}>
      {props.children}
    </DialogActions>
  )
})

interface ConfirmDialogProps {
  children: React.ReactNode
  cancelButton: React.ReactNode
  confirmButton: React.ReactNode
  onClose: () => void
  open: boolean
  title: string
}

export function ConfirmDialog(props: ConfirmDialogProps) {
  const isSmallScreen = useIsMobile()
  return (
    <Dialog open={props.open} onClose={props.onClose} TransitionComponent={Transition}>
      <DialogTitle>{props.title}</DialogTitle>
      <DialogContent style={{ paddingBottom: isSmallScreen ? 24 : undefined }}>
        <Typography variant="body2">{props.children}</Typography>
        <DialogActionsBox smallDialog>
          {props.cancelButton}
          {props.confirmButton}
        </DialogActionsBox>
      </DialogContent>
    </Dialog>
  )
}
