import React from "react"
import Dialog from "@material-ui/core/Dialog"
import DialogContent from "@material-ui/core/DialogContent"
import QRCode from "qrcode.react"
import { ActionButton, DialogActionsBox } from "./Generic"

function QRExportDialog(props: { open: boolean; data: string; onClose: () => void }) {
  return (
    <Dialog open={props.open} onClose={props.onClose}>
      <DialogContent style={{ paddingBottom: 8 }}>
        {props.open && props.data ? <QRCode size={256} value={props.data} /> : null}
        <DialogActionsBox>
          <ActionButton onClick={props.onClose}>Close</ActionButton>
        </DialogActionsBox>
      </DialogContent>
    </Dialog>
  )
}

export default QRExportDialog
