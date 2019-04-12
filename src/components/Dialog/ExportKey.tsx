import React from "react"
import Button from "@material-ui/core/Button"
import DialogContent from "@material-ui/core/DialogContent"
import DialogTitle from "@material-ui/core/DialogTitle"
import InputAdornment from "@material-ui/core/InputAdornment"
import TextField from "@material-ui/core/TextField"
import Typography from "@material-ui/core/Typography"
import LockIcon from "@material-ui/icons/LockOutlined"
import LockFilledIcon from "@material-ui/icons/Lock"
import WarnIcon from "@material-ui/icons/Warning"
import { Account } from "../../context/accounts"
import { trackError } from "../../context/notifications"
import { isWrongPasswordError } from "../../lib/errors"
import { brandColor } from "../../theme"
import { Box, HorizontalLayout } from "../Layout/Box"
import Background from "../Background"
import { ActionButton, DialogActionsBox } from "./Generic"
import QRExportDialog from "./QRExport"

function KeyExport(props: { account: Account; secretKey: string }) {
  return (
    <Box padding="8px 0 16px">
      <Background opacity={0.08}>
        <LockFilledIcon style={{ fontSize: 220 }} />
      </Background>
      <Typography variant="subtitle1" style={{ marginBottom: 8 }}>
        Plain Secret Key
      </Typography>
      <Typography
        style={{
          padding: "16px 32px",
          backgroundColor: "rgba(255, 255, 255, 0.6)",
          border: `2px solid ${brandColor}`,
          wordBreak: "break-word"
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

function WarningBox(props: WarningBoxProps) {
  return (
    <Box padding="8px 0 16px">
      <Background opacity={0.08}>
        <WarnIcon style={{ fontSize: 220 }} />
      </Background>
      <Typography component="p" variant="body1">
        Your secret key must be stored in a safe place and must not be shared with anyone.
      </Typography>
      <Typography component="p" variant="body1" style={{ marginTop: 16 }}>
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
            autoFocus={process.env.PLATFORM !== "ios"}
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
  onClose: () => void
}

function ExportKeyDialog(props: Props) {
  const [password, setPassword] = React.useState("")
  const [passwordError, setPasswordError] = React.useState<Error | null>(null)
  const [qrDialogOpen, setQrDialogOpen] = React.useState(false)
  const [isRevealed, setIsRevealed] = React.useState(false)
  const [secretKey, setSecretKey] = React.useState<string | null>(null)

  const updatePassword = (event: React.SyntheticEvent<HTMLInputElement>) => setPassword(event.currentTarget.value)

  const reveal = (event: React.SyntheticEvent) => {
    event.preventDefault()

    const passwordToUse = props.account.requiresPassword ? password : null

    props.account
      .getPrivateKey(passwordToUse)
      .then(decryptedSecretKey => {
        setPasswordError(null)
        setIsRevealed(true)
        setSecretKey(decryptedSecretKey)
      })
      .catch(error => {
        if (isWrongPasswordError(error)) {
          setPasswordError(error)
        } else {
          trackError(error)
        }
      })
  }

  return (
    <>
      <DialogTitle>Export Secret Key</DialogTitle>
      <DialogContent>
        {isRevealed && secretKey ? (
          <KeyExport account={props.account} secretKey={secretKey} />
        ) : (
          <WarningBox
            onReveal={reveal}
            password={password}
            passwordError={passwordError}
            requiresPassword={props.account.requiresPassword}
            updatePassword={updatePassword}
          />
        )}
        <DialogActionsBox>
          <ActionButton onClick={props.onClose}>Close</ActionButton>
          <ActionButton onClick={() => setQrDialogOpen(true)} style={{ display: isRevealed ? "block" : "none" }}>
            Show QR code
          </ActionButton>
        </DialogActionsBox>
      </DialogContent>
      <QRExportDialog data={secretKey || ""} open={qrDialogOpen} onClose={() => setQrDialogOpen(false)} />
    </>
  )
}

export default React.memo(ExportKeyDialog)
