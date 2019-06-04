import QRCode from "qrcode.react"
import React from "react"
import DialogContent from "@material-ui/core/DialogContent"
import InputAdornment from "@material-ui/core/InputAdornment"
import TextField from "@material-ui/core/TextField"
import Typography from "@material-ui/core/Typography"
import LockIcon from "@material-ui/icons/LockOutlined"
import LockOpenIcon from "@material-ui/icons/LockOpenOutlined"
import LockFilledIcon from "@material-ui/icons/Lock"
import WarnIcon from "@material-ui/icons/Warning"
import { Account } from "../../context/accounts"
import { trackError } from "../../context/notifications"
import { useClipboard, useIsMobile } from "../../hooks"
import { isWrongPasswordError } from "../../lib/errors"
import { Box, HorizontalLayout, VerticalLayout } from "../Layout/Box"
import Background from "../Background"
import MainTitle from "../MainTitle"
import { ActionButton, DialogActionsBox } from "./Generic"
import QRExportDialog from "./QRExport"

function KeyExport(props: { account: Account; secretKey: string }) {
  const clipboard = useClipboard()

  const copyToClipboard = React.useCallback(() => clipboard.copyToClipboard(props.secretKey), [props.secretKey])

  return (
    <Box padding="8px 0 16px">
      <Background opacity={0.08}>
        <LockFilledIcon style={{ fontSize: 220 }} />
      </Background>
      <HorizontalLayout justifyContent="center" margin="16px 0 0">
        <VerticalLayout>
          <Box onClick={copyToClipboard} margin="0 auto" style={{ cursor: "pointer" }}>
            <QRCode size={256} value={props.secretKey} />
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
              <b>{props.secretKey}</b>
            </Typography>
          </Box>
        </VerticalLayout>
      </HorizontalLayout>
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
  const isSmallScreen = useIsMobile()
  return (
    <Box padding="8px 0 0">
      <Background opacity={0.08}>
        <WarnIcon style={{ fontSize: 220 }} />
      </Background>
      <Typography component="p" variant="body1">
        Your secret key must be stored in a safe place and must not be shared with anyone.
      </Typography>
      <Typography component="p" variant="body1" style={{ marginTop: 16, marginBottom: 24 }}>
        A backup is important, though, since losing your secret key also means losing access to your account.
      </Typography>
      <form onSubmit={props.onReveal}>
        {props.requiresPassword ? (
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
        ) : null}
        <DialogActionsBox desktopStyle={{ marginTop: 32 }} smallDialog>
          <ActionButton icon={<LockOpenIcon />} onClick={props.onReveal} type="primary">
            {isSmallScreen ? "Reveal key" : "Click to reveal your secret key"}
          </ActionButton>
        </DialogActionsBox>
      </form>
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
  const isSmallScreen = useIsMobile()

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
      <DialogContent style={{ padding: isSmallScreen ? "24px" : " 24px 32px" }}>
        <Box margin="0 0 32px">
          <MainTitle onBack={props.onClose} title="Export Secret Key" />
        </Box>
        <VerticalLayout margin="0 auto" maxWidth="700px" width="100%">
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
        </VerticalLayout>
      </DialogContent>
      <QRExportDialog data={secretKey || ""} open={qrDialogOpen} onClose={() => setQrDialogOpen(false)} />
    </>
  )
}

export default React.memo(ExportKeyDialog)
