import React from "react"
import Dialog from "@material-ui/core/Dialog"
import DialogContent from "@material-ui/core/DialogContent"
import { ActionButton, DialogActionsBox } from "./Generic"

import getQRReader from "./../../platform/qr-reader"

interface Props {
  open: boolean
  onClose: () => void
  onError: (error: Error) => void
  onScan: (data: string | null) => void
}

const QRReader = getQRReader()

function QRImportDialog(props: Props) {
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
