import React from "react"
import { Account } from "../../context/accounts"
import { useIsMobile } from "../../hooks/userinterface"
import { Box } from "../Layout/Box"
import MainTitle from "../MainTitle"
import KeyExportBox from "../Account/KeyExportBox"

interface Props {
  account: Account
  onClose: () => void
}

function ReceivePaymentDialog(props: Props) {
  const isSmallScreen = useIsMobile()

  return (
    <>
      <Box width="100%" maxWidth={900} padding={isSmallScreen ? "24px" : " 24px 32px"} margin="0 auto 32px">
        <MainTitle onBack={props.onClose} title="Receive Funds" />
      </Box>
      <KeyExportBox export={props.account.publicKey} />
    </>
  )
}

export default ReceivePaymentDialog
