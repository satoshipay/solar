import React from "react"
import Button from "@material-ui/core/Button"
import Dialog from "@material-ui/core/Dialog"
import DialogActions from "@material-ui/core/DialogActions"
import DialogContent from "@material-ui/core/DialogContent"
import DialogTitle from "@material-ui/core/DialogTitle"
import Slide from "@material-ui/core/Slide"
import { TransitionProps } from "@material-ui/core/transitions/transition"
import Typography from "@material-ui/core/Typography"
import CloseIcon from "@material-ui/icons/Close"
import { useIsMobile } from "../../hooks"
import { HorizontalLayout } from "../Layout/Box"
import { HorizontalMargin } from "../Layout/Spacing"
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

interface ActionButtonProps {
  autoFocus?: boolean
  children: React.ReactNode
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
  const isSmallScreen = useIsMobile()

  const desktopStyle = React.useMemo(
    () => ({
      padding: "10px 20px",
      ...props.style
    }),
    [props.style]
  )

  const mobileStyle = React.useMemo(
    () => ({
      flexGrow: 1,
      margin: 12,
      maxWidth: "calc(50% - 32px)",
      padding: "12px 16px",
      ...props.style
    }),
    [props.style]
  )

  return (
    <Button
      autoFocus={props.autoFocus}
      color={type === "primary" || type === "submit" ? "primary" : undefined}
      disabled={props.disabled}
      form={props.form}
      onClick={props.onClick}
      style={isSmallScreen ? mobileStyle : desktopStyle}
      type={type === "submit" ? "submit" : undefined}
      variant="contained"
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
  return (
    <>
      {props.smallDialog ? null : (
        // Placeholder to prevent other dialog content from being hidden below the actions box
        // Make sure its height matches the height of the actions box
        <div style={{ width: "100%", height: 72 }} />
      )}
      <HorizontalLayout
        className="iphone-notch-bottom-spacing"
        style={{
          position: "fixed",
          left: 0,
          bottom: 0,
          padding: undefined,
          width: "100%",
          background: "white",
          boxShadow: "0 0 16px 0 rgba(0, 0, 0, 0.1)",
          justifyContent: "flex-end"
        }}
      >
        {props.children}
      </HorizontalLayout>
    </>
  )
})

interface DialogActionsBoxProps {
  children: React.ReactNode | React.ReactNode[]
  desktopStyle?: React.CSSProperties
  smallDialog?: boolean
  spacing?: "normal" | "large"
}

// tslint:disable-next-line no-shadowed-variable
export const DialogActionsBox = React.memo(function DialogActionsBox(props: DialogActionsBoxProps) {
  const isSmallScreen = useIsMobile()
  if (isSmallScreen) {
    return <MobileDialogActionsBox smallDialog={props.smallDialog}>{props.children}</MobileDialogActionsBox>
  }
  const desktopStyle: React.CSSProperties = {
    alignItems: "stretch",
    marginTop: 32,
    marginLeft: 0,
    marginRight: 0,
    marginBottom: 0,
    ...props.desktopStyle
  }
  return (
    <DialogActions style={desktopStyle}>
      {React.Children.toArray(props.children)
        .filter(child => Boolean(child))
        .map(
          (child, index) =>
            index === 0 ? (
              child
            ) : (
              <React.Fragment key={index}>
                <HorizontalMargin size={props.spacing === "large" ? 32 : 16} />
                {child}
              </React.Fragment>
            )
        )}
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
  return (
    <Dialog open={props.open} onClose={props.onClose} TransitionComponent={Transition}>
      <DialogTitle>{props.title}</DialogTitle>
      <DialogContent>
        <Typography variant="body2">{props.children}</Typography>
        <DialogActionsBox>
          {props.cancelButton}
          {props.confirmButton}
        </DialogActionsBox>
      </DialogContent>
    </Dialog>
  )
}
