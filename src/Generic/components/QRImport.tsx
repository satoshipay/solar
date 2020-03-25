import React from "react"
import Dialog from "@material-ui/core/Dialog"
import DialogContent from "@material-ui/core/DialogContent"
import { QRReader, isFullscreenQRPreview } from "~Platform/components"
import { ActionButton, DialogActionsBox } from "./DialogActions"

interface Props {
  open: boolean
  onClose: () => void
  onError: (error: Error) => void
  onScan: (data: string | null) => void
}

function QRImportDialog(props: Props) {
  if (isFullscreenQRPreview) {
    // Don't show the Dialog component if this QR reader implementation shows the scanner fullscreen
    if (props.open) {
      // Close non-existing dialog right away, so the scanner can be re-opened
      props.onClose()
    }
    return props.open ? (
      <QRReader onError={props.onError} onScan={props.onScan} style={{ width: 256, height: 256 }} />
    ) : null
  }
  return (
    <Dialog open={props.open} onClose={props.onClose}>
      <DialogContent style={{ paddingBottom: 8 }}>
        {props.open ? (
          <QRReader onError={props.onError} onScan={props.onScan} style={{ width: 256, height: 256 }} />
        ) : null}
        <DialogActionsBox>
          <ActionButton onClick={props.onClose}>Cancel</ActionButton>
        </DialogActionsBox>
      </DialogContent>
    </Dialog>
  )
}

export default QRImportDialog
