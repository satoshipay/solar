import React from "react"
import Dialog from "@material-ui/core/Dialog"
import Slide from "@material-ui/core/Slide"
import Typography from "@material-ui/core/Typography"
import QRCode from "qrcode.react"
import { Account } from "../../context/accounts"
import { NotificationsContext } from "../../context/notifications"
import { Box, HorizontalLayout, VerticalLayout } from "../Layout/Box"
import MainTitle from "../MainTitle"

const Transition = (props: any) => <Slide {...props} direction="left" />

interface Props {
  account: Account
  open: boolean
  onClose: () => void
}

function ReceivePaymentDialog(props: Props) {
  const { showNotification } = React.useContext(NotificationsContext)

  const copyToClipboard = async () => {
    await (navigator as any).clipboard.writeText(props.account.publicKey)
    showNotification("info", "Copied to clipboard.")
  }
  return (
    <Dialog open={props.open} fullScreen onClose={props.onClose} TransitionComponent={Transition}>
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
              variant="subheading"
            >
              <b>{props.account.publicKey}</b>
            </Typography>
          </Box>
        </VerticalLayout>
      </HorizontalLayout>
    </Dialog>
  )
}

export default ReceivePaymentDialog
