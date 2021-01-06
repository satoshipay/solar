import React from "react"
import { useTranslation } from "react-i18next"
import Button, { ButtonProps } from "@material-ui/core/Button"
import Dialog from "@material-ui/core/Dialog"
import DialogActions from "@material-ui/core/DialogActions"
import DialogContent from "@material-ui/core/DialogContent"
import DialogTitle from "@material-ui/core/DialogTitle"
import Typography from "@material-ui/core/Typography"
import { makeStyles } from "@material-ui/core/styles"
import CloseIcon from "@material-ui/icons/Close"
import { useIsMobile } from "~Generic/hooks/userinterface"
import { breakpoints, MobileKeyboardOpenedSelector, CompactDialogTransition } from "~App/theme"
import { setupRerenderListener } from "~Platform/keyboard-hack"
import ButtonIconLabel from "~Generic/components/ButtonIconLabel"

const closeIcon = <CloseIcon />

interface MaybeIconProps {
  icon?: React.ReactNode
  label: React.ReactNode
  loading?: boolean
}

function MaybeIcon(props: MaybeIconProps) {
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
    left: 8,
    right: 8,
    bottom: 0,
    backgroundColor: "#fcfcfc",
    justifyContent: "flex-end",

    [MobileKeyboardOpenedSelector()]: {
      // For iOS keyboard: Viewport shrinks when keyboard opens. Make actions non-sticky then,
      // so they don't take too much screen space; making it consistent with other iOS apps.
      position: "static !important" as any
    }
  },
  mobileInlineSpacePlaceholder: {
    width: "100% !important",
    height: "88px !important",

    [MobileKeyboardOpenedSelector()]: {
      display: "none"
    }
  },
  common: {
    flexShrink: 0,
    maxHeight: 88,
    overflow: "hidden",
    transition: `max-height ${theme.transitions.duration.standard}ms ${theme.transitions.easing.easeInOut}`,
    zIndex: 1
  },
  hidden: {
    maxHeight: 0,
    paddingTop: 0,
    paddingBottom: 0
  },
  transparent: {
    background: "transparent"
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
  testnet?: boolean
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
      color={type === "primary" || type === "submit" ? (props.testnet ? "secondary" : "primary") : undefined}
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

export function CloseButton(props: { form?: string; onClick?: (event: React.SyntheticEvent) => void }) {
  const { t } = useTranslation()
  return (
    <ActionButton form={props.form} icon={closeIcon} onClick={props.onClick} type="secondary">
      {t("generic.dialog-actions.close.label")}
    </ActionButton>
  )
}

interface MobileDialogActionsBoxProps {
  children: React.ReactNode | React.ReactNode[]
  className?: string
  hidden?: boolean
  smallDialog?: boolean
  transparent?: boolean
}

const MobileDialogActionsBox = React.memo(
  React.forwardRef(function MobileDialogActionsBox(props: MobileDialogActionsBoxProps, ref: React.Ref<HTMLDivElement>) {
    const classes = useActionButtonStyles()
    return (
      <>
        {props.smallDialog ? null : (
          // Placeholder to prevent other dialog content from being hidden below the actions box
          // Make sure its height matches the height of the actions box
          <div
            className={`${classes.common} ${classes.mobileInlineSpacePlaceholder} ${
              props.hidden ? classes.hidden : ""
            }`}
          />
        )}
        <div
          className={[
            "iphone-notch-bottom-spacing",
            classes.common,
            classes.mobileDialogActionsBox,
            props.className || "",
            props.hidden ? classes.hidden : "",
            props.transparent ? classes.transparent : ""
          ].join(" ")}
          ref={ref}
        >
          {props.children}
        </div>
      </>
    )
  })
)

interface DialogActionsBoxProps {
  children: React.ReactNode | React.ReactNode[]
  className?: string
  desktopStyle?: React.CSSProperties
  hidden?: boolean
  preventMobileActionsBox?: boolean
  smallDialog?: boolean
  transparent?: boolean
}

export const DialogActionsBox = React.memo(
  React.forwardRef(function DialogActionsBox(props: DialogActionsBoxProps, ref: React.Ref<HTMLDivElement>) {
    const classes = useActionButtonStyles()
    const isSmallScreen = useIsMobile()

    React.useEffect(() => {
      // Little hack to force re-rendering the dialog when the keyboard closes
      // to prevent broken UI to be shown
      const elements = document.querySelectorAll(".dialog-body")
      const unsubscribe = setupRerenderListener(elements)

      return unsubscribe
    }, [])

    if (isSmallScreen && !props.preventMobileActionsBox) {
      return (
        <MobileDialogActionsBox
          className={props.className}
          hidden={props.hidden}
          ref={ref}
          smallDialog={props.smallDialog}
          transparent={props.transparent}
        >
          {props.children}
        </MobileDialogActionsBox>
      )
    }

    return (
      <DialogActions
        className={`${classes.common} ${classes.inlineDialogActionsBox} ${
          props.hidden ? classes.hidden : ""
        } ${props.className || ""}`}
        ref={ref}
        style={props.desktopStyle}
      >
        {props.children}
      </DialogActions>
    )
  })
)

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
    <Dialog open={props.open} onClose={props.onClose} TransitionComponent={CompactDialogTransition}>
      <DialogTitle>{props.title}</DialogTitle>
      <DialogContent style={{ paddingBottom: isSmallScreen ? 24 : undefined }}>
        <Typography variant="body2">{props.children}</Typography>
        <DialogActionsBox preventMobileActionsBox smallDialog>
          {props.cancelButton}
          {props.confirmButton}
        </DialogActionsBox>
      </DialogContent>
    </Dialog>
  )
}
