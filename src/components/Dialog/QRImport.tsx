import React from "react"
import Button from "@material-ui/core/Button"
import Dialog from "@material-ui/core/Dialog"
import DialogActions from "@material-ui/core/DialogActions"
import DialogContent from "@material-ui/core/DialogContent"
import QRScanner from "react-qr-reader"

interface Props {
  open: boolean
  onClose: () => void
  onError: (error: Error) => void
  onScan: (data: string | null) => void
}

const QRImportDialog = (props: Props) => (
  <Dialog open={props.open} onClose={props.onClose}>
    <DialogContent style={{ paddingBottom: 8 }}>
      {props.open ? (
        <QRScanner onError={props.onError} onScan={props.onScan} style={{ width: 256, height: 256 }} />
      ) : null}
      <DialogActions>
        <Button color="primary" onClick={props.onClose}>
          Cancel
        </Button>
      </DialogActions>
    </DialogContent>
  </Dialog>
)

export default QRImportDialog
