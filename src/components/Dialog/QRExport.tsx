import React from "react"
import Button from "@material-ui/core/Button"
import Dialog from "@material-ui/core/Dialog"
import DialogActions from "@material-ui/core/DialogActions"
import DialogContent from "@material-ui/core/DialogContent"
import QRCode from "qrcode.react"

const QRExportDialog = (props: { open: boolean; data: string; onClose: () => void }) => (
  <Dialog open={props.open} onClose={props.onClose}>
    <DialogContent style={{ paddingBottom: 8 }}>
      {props.open && props.data ? <QRCode size={256} value={props.data} /> : null}
      <DialogActions>
        <Button color="primary" onClick={props.onClose}>
          Close
        </Button>
      </DialogActions>
    </DialogContent>
  </Dialog>
)

export default QRExportDialog
