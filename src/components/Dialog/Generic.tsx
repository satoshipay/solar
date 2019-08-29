import React from "react"
import Button, { ButtonProps } from "@material-ui/core/Button"
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

const useActionButtonStyles = makeStyles(theme => ({
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
    display: "flex",
    position: "fixed",
    left: 0,
    bottom: 0,
    width: "100%",
    backgroundColor: "#fcfcfc",
    boxShadow: "0 0 16px 0 rgba(0, 0, 0, 0.1)",
    justifyContent: "flex-end"
  },
  common: {
    maxHeight: 88,
    overflow: "hidden",
    transition: `max-height ${theme.transitions.duration.standard}ms ${theme.transitions.easing.easeInOut}`,
    zIndex: 1
  },
  hidden: {
    maxHeight: 0
  },
  actionButton: {
    "$inlineDialogActionsBox &": {
      boxShadow: "none",
      padding: "10px 20px"
    },

    "$mobileDialogActionsBox &": {
      flexBasis: "calc(100% - 24px)",
      flexGrow: 1,
      margin: 12,
      padding: 20,

      "&:not(:first-child)": {
        flexBasis: "calc(50% - 16px)",
        marginLeft: 6
      },
      "&:not(:last-child)": {
        flexBasis: "calc(50% - 16px)",
        marginRight: 6
      }
    }
  }
}))

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
  variant?: ButtonProps["variant"]
  type?: "primary" | "secondary" | "submit"
}

export function ActionButton(props: ActionButtonProps) {
  const { type = "secondary" } = props
  const classes = useActionButtonStyles()
  const isSmallScreen = useIsMobile()
  const autoVariant = !isSmallScreen && (props.type === "secondary" || !props.type) ? "text" : "contained"

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
      variant={props.variant || autoVariant}
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
  hidden?: boolean
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
        <div
          className={`${classes.common} ${props.hidden ? classes.hidden : ""}`}
          style={{ width: "100%", height: 88 }}
        />
      )}
      <div
        className={`iphone-notch-bottom-spacing ${classes.common} ${classes.mobileDialogActionsBox} ${
          props.hidden ? classes.hidden : ""
        }`}
      >
        {props.children}
      </div>
    </>
  )
})

interface DialogActionsBoxProps {
  children: React.ReactNode | React.ReactNode[]
  className?: string
  desktopStyle?: React.CSSProperties
  hidden?: boolean
  preventMobileActionsBox?: boolean
  smallDialog?: boolean
  spacing?: "normal" | "large"
}

// tslint:disable-next-line no-shadowed-variable
export const DialogActionsBox = React.memo(function DialogActionsBox(props: DialogActionsBoxProps) {
  const classes = useActionButtonStyles()
  const isSmallScreen = useIsMobile()

  if (isSmallScreen && !props.preventMobileActionsBox) {
    return (
      <MobileDialogActionsBox hidden={props.hidden} smallDialog={props.smallDialog}>
        {props.children}
      </MobileDialogActionsBox>
    )
  }

  return (
    <DialogActions
      className={`${classes.common} ${classes.inlineDialogActionsBox} ${
        props.hidden ? classes.hidden : ""
      } ${props.className || ""}`}
      style={props.desktopStyle}
    >
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
