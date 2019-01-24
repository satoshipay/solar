import React from "react"
import Button from "@material-ui/core/Button"
import Dialog from "@material-ui/core/Dialog"
import DialogActions from "@material-ui/core/DialogActions"
import DialogContent from "@material-ui/core/DialogContent"
import DialogTitle from "@material-ui/core/DialogTitle"
import Slide, { SlideProps } from "@material-ui/core/Slide"
import Typography from "@material-ui/core/Typography"
import { HorizontalMargin } from "../Layout/Spacing"
import ButtonIconLabel from "../ButtonIconLabel"

const Transition = (props: SlideProps) => <Slide {...props} direction="up" />

function MaybeIcon(props: { icon?: React.ReactNode; label: React.ReactNode; loading?: boolean }) {
  return (
    <>
      {props.icon ? (
        <ButtonIconLabel label={props.label} loading={props.loading}>
          {props.icon}
        </ButtonIconLabel>
      ) : (
        props.label
      )}
    </>
  )
}

interface ActionButtonProps {
  autoFocus?: boolean
  children: React.ReactNode
  icon?: React.ReactNode
  loading?: boolean
  onClick: () => void
  style?: React.CSSProperties
  type?: "primary" | "secondary"
}

export function ActionButton(props: ActionButtonProps) {
  const { type = "secondary" } = props
  return (
    <Button
      autoFocus={props.autoFocus}
      color={type === "primary" ? "primary" : undefined}
      onClick={props.onClick}
      style={props.style}
      variant="contained"
    >
      <MaybeIcon icon={props.icon} label={props.children} loading={props.loading} />
    </Button>
  )
}

interface DialogActionProps {
  children: React.ReactNode[]
}

export function DialogActionsBox(props: DialogActionProps) {
  return (
    <DialogActions style={{ alignItems: "stretch", marginTop: 32 }}>
      {React.Children.map(
        props.children,
        (child, index) =>
          index === 0 ? (
            child
          ) : (
            <>
              <HorizontalMargin size={16} />
              {child}
            </>
          )
      )}
    </DialogActions>
  )
}

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
        <Typography variant="body1">{props.children}</Typography>
        <DialogActionsBox>
          {props.cancelButton}
          {props.confirmButton}
        </DialogActionsBox>
      </DialogContent>
    </Dialog>
  )
}
