import React from "react"
import { Account } from "../../context/accounts"
import { useIsMobile } from "../../hooks/userinterface"
import { Box } from "../Layout/Box"
import DialogBody from "../Dialog/DialogBody"
import KeyExportBox from "../Account/KeyExportBox"
import MainTitle from "../MainTitle"

interface Props {
  account: Account
  onClose: () => void
}

function ReceivePaymentDialog(props: Props) {
  const isSmallScreen = useIsMobile()
  return (
    <DialogBody top={<MainTitle onBack={props.onClose} title="Receive Funds" />}>
      <Box width="100%" margin="32px auto">
        <KeyExportBox export={props.account.publicKey} size={isSmallScreen ? 192 : 256} />
      </Box>
    </DialogBody>
  )
}

export default React.memo(ReceivePaymentDialog)
