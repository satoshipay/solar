import Box from "@material-ui/core/Box"
import React from "react"
import MainTitle from "~Generic/components/MainTitle"
import DialogBody from "~Layout/components/DialogBody"
import PeerConnection from "./PeerConnection"

function ImportAccounts() {
  return (
    <PeerConnection initiator={false}>
      {({ sendMessage }) => {
        sendMessage("test")
        return <div>Test</div>
      }}
    </PeerConnection>
  )
}

interface Props {
  onClose: () => void
}

function ImportAccountsDialog(props: Props) {
  return (
    <DialogBody top={<MainTitle onBack={props.onClose} title="Import Accounts" />}>
      <Box width="100%" margin="32px auto">
        <ImportAccounts />
      </Box>
    </DialogBody>
  )
}

export default ImportAccountsDialog
