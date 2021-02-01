import Box from "@material-ui/core/Box"
import Button from "@material-ui/core/Button"
import React from "react"
import { AccountsContext } from "~App/contexts/accounts"
import MainTitle from "~Generic/components/MainTitle"
import DialogBody from "~Layout/components/DialogBody"
import PeerConnection from "./PeerConnection"

interface ExportAccountsProps {
  sendMessage: (message: string) => void
}

function ExportAccounts(props: ExportAccountsProps) {
  const { sendMessage } = props
  const { accounts } = React.useContext(AccountsContext)

  const transferKeysData = React.useCallback(async () => {
    const keysData = await Promise.all(accounts.map(account => account.getRawKeyData()))
    sendMessage(JSON.stringify(keysData))
  }, [accounts, sendMessage])

  return (
    <Box>
      <Button onClick={transferKeysData}>Transfer accounts</Button>
    </Box>
  )
}

interface Props {
  onClose: () => void
}

function ExportAccountsDialog(props: Props) {
  return (
    <DialogBody top={<MainTitle onBack={props.onClose} title="Export Accounts" />}>
      <Box width="100%" margin="32px auto">
        <PeerConnection initiator={true}>
          {({ sendMessage }) => <ExportAccounts sendMessage={sendMessage} />}
        </PeerConnection>
      </Box>
    </DialogBody>
  )
}

export default ExportAccountsDialog
