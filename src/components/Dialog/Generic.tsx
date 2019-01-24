import React from "react"
import Button from "@material-ui/core/Button"
import Dialog from "@material-ui/core/Dialog"
import DialogActions from "@material-ui/core/DialogActions"
import DialogContent from "@material-ui/core/DialogContent"
import DialogTitle from "@material-ui/core/DialogTitle"
import Slide, { SlideProps } from "@material-ui/core/Slide"
import Typography from "@material-ui/core/Typography"
import { HorizontalMargin } from "../Layout/Spacing"

const Transition = (props: SlideProps) => <Slide {...props} direction="up" />

export function ActionButton(props: { children: React.ReactNode; onClick: () => void }) {
  return (
    <Button onClick={props.onClick} variant="contained">
      {props.children}
    </Button>
  )
}

export function SubmitButton(props: { children: React.ReactNode; onClick: () => void }) {
  return (
    <Button color="primary" onClick={props.onClick} variant="contained">
      {props.children}
    </Button>
  )
}

interface DialogActionProps {
  children: React.ReactNode[]
}

export function DialogActionsBox(props: DialogActionProps) {
  return (
    <DialogActions style={{ marginTop: 32 }}>
      {React.Children.map(
        props.children,
        (child, index) =>
          index === 0 ? (
            child
          ) : (
            <>
              <HorizontalMargin size={12} />
              {child}
            </>
          )
      )}
    </DialogActions>
  )
}

interface ConfirmDialogProps {
  cancelButton: React.ReactNode
  confirmButton: React.ReactNode
  content: React.ReactNode
  onClose: () => void
  open: boolean
  title: string
}

export function ConfirmDialog(props: ConfirmDialogProps) {
  return (
    <Dialog open={props.open} onClose={props.onClose} TransitionComponent={Transition}>
      <DialogTitle>{props.title}</DialogTitle>
      <DialogContent>
        <Typography variant="body1">{props.content}</Typography>
        <DialogActions>
          {props.cancelButton}
          {props.confirmButton}
        </DialogActions>
      </DialogContent>
    </Dialog>
  )
}
