import React from "react"
import Typography from "@material-ui/core/Typography"
import QRCode from "qrcode.react"
import { Account } from "../../context/accounts"
import { NotificationsContext } from "../../context/notifications"
import * as clipboard from "../../platform/clipboard"
import { Box, HorizontalLayout, VerticalLayout } from "../Layout/Box"
import MainTitle from "../MainTitle"

interface Props {
  account: Account
  onClose: () => void
}

function ReceivePaymentDialog(props: Props) {
  const { showNotification } = React.useContext(NotificationsContext)

  const copyToClipboard = async () => {
    await clipboard.copyToClipboard(props.account.publicKey)
    showNotification("info", "Copied to clipboard.")
  }
  return (
    <>
      <Box width="100%" maxWidth={900} padding="32px" margin="0 auto 32px">
        <MainTitle onBack={props.onClose} title="Receive Funds" />
      </Box>
      <HorizontalLayout justifyContent="center">
        <VerticalLayout>
          <Box onClick={copyToClipboard} margin="0 auto" style={{ cursor: "pointer" }}>
            <QRCode size={256} value={props.account.publicKey} />
          </Box>
          <Box margin="12px auto 12px">
            <Typography align="center" style={{ marginBottom: 12 }}>
              Tap to copy:
            </Typography>
            <Typography
              align="center"
              component="p"
              onClick={copyToClipboard}
              role="button"
              style={{ cursor: "pointer", wordWrap: "break-word", maxWidth: window.innerWidth - 75 }}
              variant="subtitle1"
            >
              <b>{props.account.publicKey}</b>
            </Typography>
          </Box>
        </VerticalLayout>
      </HorizontalLayout>
    </>
  )
}

export default ReceivePaymentDialog
