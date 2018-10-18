import React from "react"
import Button from "@material-ui/core/Button"
import Dialog from "@material-ui/core/Dialog"
import DialogActions from "@material-ui/core/DialogActions"
import DialogContent from "@material-ui/core/DialogContent"
import DialogTitle from "@material-ui/core/DialogTitle"
import InputAdornment from "@material-ui/core/InputAdornment"
import TextField from "@material-ui/core/TextField"
import Typography from "@material-ui/core/Typography"
import LockIcon from "@material-ui/icons/LockOutlined"
import LockFilledIcon from "@material-ui/icons/Lock"
import WarnIcon from "@material-ui/icons/Warning"
import { Account } from "../../context/accounts"
import { addError } from "../../context/notifications"
import { isWrongPasswordError } from "../../lib/errors"
import { brandColor } from "../../theme"
import { Box, HorizontalLayout } from "../Layout/Box"
import Background from "../Background"
import QRExportDialog from "./QRExport"

const KeyExport = (props: { account: Account; secretKey: string }) => {
  return (
    <Box padding="8px 0 16px">
      <Background opacity={0.08}>
        <LockFilledIcon style={{ fontSize: 220 }} />
      </Background>
      <Typography variant="subheading" style={{ marginBottom: 8 }}>
        Plain Secret Key
      </Typography>
      <Typography
        style={{
          padding: "16px 32px",
          backgroundColor: "rgba(255, 255, 255, 0.6)",
          border: `2px solid ${brandColor}`
        }}
      >
        {props.secretKey}
      </Typography>
    </Box>
  )
}

interface WarningBoxProps {
  password: string
  passwordError: Error | null
  requiresPassword: boolean
  onReveal: (event: React.SyntheticEvent) => void
  updatePassword: (event: React.ChangeEvent<HTMLInputElement>) => void
}

const WarningBox = (props: WarningBoxProps) => {
  return (
    <Box padding="8px 0 16px">
      <Background opacity={0.08}>
        <WarnIcon style={{ fontSize: 220 }} />
      </Background>
      <Typography component="p" variant="body2">
        Your secret key must be stored in a safe place and must not be shared with anyone.
      </Typography>
      <Typography component="p" variant="body2" style={{ marginTop: 16 }}>
        A backup is important, though, since losing your secret key also means losing access to your account.
      </Typography>
      <HorizontalLayout justifyContent="center" margin="24px 0 0">
        <Button variant="outlined" onClick={props.onReveal}>
          Click to reveal your secret key
        </Button>
      </HorizontalLayout>
      {props.requiresPassword ? (
        <form onSubmit={props.onReveal}>
          <TextField
            autoFocus
            fullWidth
            error={props.passwordError !== null}
            label={props.passwordError ? props.passwordError.message : "Password"}
            margin="dense"
            type="password"
            value={props.password}
            onChange={props.updatePassword}
            style={{ marginTop: 8 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon color="disabled" />
                </InputAdornment>
              )
            }}
          />
        </form>
      ) : null}
    </Box>
  )
}

interface Props {
  account: Account
  open: boolean
  onClose: () => void
}

interface State {
  password: string
  passwordError: Error | null
  qrDialogOpen: boolean
  reveal: boolean
  secretKey: string | null
}

class ExportKeyDialog extends React.Component<Props, State> {
  state: State = {
    password: "",
    passwordError: null,
    qrDialogOpen: false,
    reveal: false,
    secretKey: null
  }

  updatePassword = (event: React.SyntheticEvent<HTMLInputElement>) => {
    this.setState({
      password: event.currentTarget.value
    })
  }

  reveal = (event: React.SyntheticEvent) => {
    event.preventDefault()

    const { account } = this.props
    const password = account.requiresPassword ? this.state.password : null

    account
      .getPrivateKey(password)
      .then(secretKey => {
        this.setState({ passwordError: null, reveal: true, secretKey })
      })
      .catch(error => {
        if (isWrongPasswordError(error)) {
          this.setState({ passwordError: error })
        } else {
          addError(error)
        }
      })
  }

  closeQRDialog = () => {
    this.setState({ qrDialogOpen: false })
  }

  showQRDialog = () => {
    this.setState({ qrDialogOpen: true })
  }

  render() {
    return (
      <Dialog open={this.props.open} onClose={this.props.onClose}>
        <DialogTitle>Export Secret Key</DialogTitle>
        <DialogContent>
          {this.state.reveal && this.state.secretKey ? (
            <KeyExport account={this.props.account} secretKey={this.state.secretKey} />
          ) : (
            <WarningBox
              onReveal={this.reveal}
              password={this.state.password}
              passwordError={this.state.passwordError}
              requiresPassword={this.props.account.requiresPassword}
              updatePassword={this.updatePassword}
            />
          )}
          <DialogActions>
            <Button
              color="primary"
              onClick={this.showQRDialog}
              style={{ display: this.state.reveal ? "block" : "none" }}
            >
              Show QR code
            </Button>
            <Button color="primary" onClick={this.props.onClose}>
              Close
            </Button>
          </DialogActions>
        </DialogContent>
        <QRExportDialog data={this.state.secretKey || ""} open={this.state.qrDialogOpen} onClose={this.closeQRDialog} />
      </Dialog>
    )
  }
}

export default ExportKeyDialog
