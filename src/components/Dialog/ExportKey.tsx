import React from "react"
import Button from "@material-ui/core/Button"
import Dialog from "@material-ui/core/Dialog"
import DialogActions from "@material-ui/core/DialogActions"
import DialogContent from "@material-ui/core/DialogContent"
import DialogContentText from "@material-ui/core/DialogContentText"
import DialogTitle from "@material-ui/core/DialogTitle"
import Typography from "@material-ui/core/Typography"
import red from "@material-ui/core/colors/red"
import { Account } from "../../stores/accounts"
import { addError } from "../../stores/notifications"
import { Box, HorizontalLayout } from "../Layout/Box"

const KeyExport = (props: { account: Account; secretKey: string }) => {
  return (
    <Box padding="8px 0 16px">
      <Typography variant="subheading" style={{ marginBottom: 8 }}>
        Plain Secret Key
      </Typography>
      <Typography style={{ padding: "16px 32px", border: `2px solid ${red.A200}` }}>{props.secretKey}</Typography>
    </Box>
  )
}

const WarningBox = (props: { onReveal: () => void }) => {
  return (
    <Box padding="8px 0 16px">
      <Typography component="p" variant="body2">
        Your secret key must be stored in a safe place and must not be shared with anyone.
      </Typography>
      <Typography component="p" variant="body2" style={{ marginTop: 16 }}>
        A backup is important, though, since losing your secret key also means losing access to your account.
      </Typography>
      {/* TODO: Show password textfield if necessary */}
      <HorizontalLayout justifyContent="center" margin="24px 0 0">
        <Button onClick={props.onReveal}>Click to reveal your secret key</Button>
      </HorizontalLayout>
    </Box>
  )
}

interface Props {
  account: Account
  open: boolean
  onClose: () => void
}

interface State {
  reveal: boolean
  secretKey: string | null
}

class ExportKeyDialog extends React.Component<Props, State> {
  state: State = {
    reveal: false,
    secretKey: null
  }

  reveal = () => {
    this.setState({ reveal: true })

    const password = null
    this.props.account
      .getPrivateKey(password)
      .then(secretKey => this.setState({ secretKey }))
      .catch(error => addError(error))
  }

  render() {
    return (
      <Dialog open={this.props.open} onClose={this.props.onClose}>
        <DialogTitle>Export Secret Key</DialogTitle>
        <DialogContent>
          {this.state.reveal && this.state.secretKey ? (
            <KeyExport account={this.props.account} secretKey={this.state.secretKey} />
          ) : (
            <WarningBox onReveal={this.reveal} />
          )}
          <DialogActions>
            <Button color="primary" onClick={this.props.onClose}>
              Close
            </Button>
          </DialogActions>
        </DialogContent>
      </Dialog>
    )
  }
}

export default ExportKeyDialog
