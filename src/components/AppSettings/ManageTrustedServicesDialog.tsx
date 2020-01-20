import React from "react"
import DialogContent from "@material-ui/core/DialogContent"
import DialogContentText from "@material-ui/core/DialogContentText"
import DialogBody from "../Dialog/DialogBody"
import MainTitle from "../MainTitle"
import TrustedServiceSelectionList from "./TrustedServiceSelectionList"

interface ManageTrustedServicesDialogProps {
  onClose: () => void
}

function ManageTrustedServicesDialog(props: ManageTrustedServicesDialogProps) {
  return (
    <DialogBody
      top={
        <MainTitle
          title="View Trusted Services"
          titleColor="inherit"
          onBack={props.onClose}
          style={{ marginTop: 0, marginLeft: 0 }}
        />
      }
    >
      <DialogContent style={{ flexGrow: 0, padding: 0 }}>
        <DialogContentText align="justify" style={{ marginTop: 24 }}>
          Trusted Services are domains whose (SEP-0007) requests will be processed without requiring additional
          confirmation from you. You can choose to add a new service to this list every time you receive a request from
          an unknown domain.
        </DialogContentText>

        <TrustedServiceSelectionList />
      </DialogContent>
    </DialogBody>
  )
}

export default React.memo(ManageTrustedServicesDialog)
