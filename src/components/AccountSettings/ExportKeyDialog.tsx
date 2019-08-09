import React from "react"
import InputAdornment from "@material-ui/core/InputAdornment"
import TextField from "@material-ui/core/TextField"
import Typography from "@material-ui/core/Typography"
import LockIcon from "@material-ui/icons/LockOutlined"
import LockOpenIcon from "@material-ui/icons/LockOpenOutlined"
import LockFilledIcon from "@material-ui/icons/Lock"
import WarnIcon from "@material-ui/icons/Warning"
import { Account } from "../../context/accounts"
import { trackError } from "../../context/notifications"
import { useIsMobile } from "../../hooks"
import { isWrongPasswordError } from "../../lib/errors"
import KeyExportBox from "../Account/KeyExportBox"
import DialogBody from "../Dialog/DialogBody"
import { Box } from "../Layout/Box"
import MainTitle from "../MainTitle"
import { ActionButton, DialogActionsBox } from "../Dialog/Generic"

interface PromptToRevealProps {
  children: React.ReactNode
  password: string
  passwordError: Error | null
  requiresPassword: boolean
  title: React.ReactNode
  onReveal: (event: React.SyntheticEvent) => void
  updatePassword: (event: React.ChangeEvent<HTMLInputElement>) => void
}

function PromptToReveal(props: PromptToRevealProps) {
  const isSmallScreen = useIsMobile()
  return (
    <DialogBody
      background={<WarnIcon style={{ fontSize: 220 }} />}
      top={props.title}
      bottom={
        <DialogActionsBox desktopStyle={{ marginTop: 32 }} smallDialog>
          <ActionButton icon={<LockOpenIcon />} onClick={props.onReveal} type="primary">
            {isSmallScreen ? "Reveal key" : "Click to reveal secret key"}
          </ActionButton>
        </DialogActionsBox>
      }
    >
      {props.children}
      <form noValidate onSubmit={props.onReveal}>
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
      </form>
    </DialogBody>
  )
}

interface ShowSecretKeyProps {
  export: string
  onConfirm?: () => void
  title: React.ReactNode
  variant: Props["variant"]
}

function ShowSecretKey(props: ShowSecretKeyProps) {
  return (
    <DialogBody
      background={<LockFilledIcon style={{ fontSize: 220 }} />}
      top={props.title}
      bottom={
        props.onConfirm ? (
          <DialogActionsBox desktopStyle={{ marginTop: 32 }} smallDialog>
            <ActionButton onClick={props.onConfirm} type="primary">
              Done
            </ActionButton>
          </DialogActionsBox>
        ) : null
      }
    >
      {props.variant === "initial-backup" ? (
        <Typography align="center" component="p" variant="h6" style={{ marginTop: -8, marginBottom: 24 }}>
          Write down the key on paper and store it in a safe place.
        </Typography>
      ) : null}
      <Box padding="8px 0 16px">
        <KeyExportBox hideTapToCopy={props.variant === "initial-backup"} export={props.export} />
      </Box>
    </DialogBody>
  )
}

interface Props {
  account: Account
  onClose?: () => void
  onConfirm?: () => void
  variant: "export" | "initial-backup"
}

function ExportKeyDialog(props: Props) {
  const [password, setPassword] = React.useState("")
  const [passwordError, setPasswordError] = React.useState<Error | null>(null)
  const [isRevealed, setIsRevealed] = React.useState(false)
  const [secretKey, setSecretKey] = React.useState<string | null>(null)

  const onBackButtonClick = React.useCallback(props.onClose || (() => undefined), [props.onClose])

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

  const updatePassword = React.useCallback(
    (event: React.SyntheticEvent<HTMLInputElement>) => setPassword(event.currentTarget.value),
    []
  )

  const titleContent = React.useMemo(
    () => (
      <MainTitle
        hideBackButton={!props.onClose}
        onBack={onBackButtonClick}
        style={{ marginBottom: 24 }}
        title={props.variant === "initial-backup" ? "Secret Key Backup" : "Export Secret Key"}
      />
    ),
    [props.onClose, props.variant, onBackButtonClick]
  )

  const backupInfoContent = React.useMemo(
    () => (
      <Box style={{ fontSize: "140%" }}>
        <Typography component="p" variant="body1" style={{ fontSize: "inherit" }}>
          Please back up your secret key now.
        </Typography>
        <Typography component="p" variant="body1" style={{ marginTop: 16, marginBottom: 24, fontSize: "inherit" }}>
          The secret key backup is the only way to recover your funds if you forget your password or cannot access your
          device anymore.
        </Typography>
      </Box>
    ),
    []
  )

  const exportInfoContent = React.useMemo(
    () => (
      <>
        <Typography component="p" variant="body1">
          Your secret key must be stored in a safe place and must not be shared with anyone.
        </Typography>
        <Typography component="p" variant="body1" style={{ marginTop: 16, marginBottom: 24 }}>
          The secret key backup is the only way to recover your funds if you forget your password or cannot access your
          device anymore.
        </Typography>
      </>
    ),
    []
  )

  return isRevealed && secretKey ? (
    <ShowSecretKey export={secretKey} onConfirm={props.onConfirm} title={titleContent} variant={props.variant} />
  ) : (
    <PromptToReveal
      onReveal={reveal}
      password={password}
      passwordError={passwordError}
      requiresPassword={props.account.requiresPassword}
      title={titleContent}
      updatePassword={updatePassword}
    >
      {props.variant === "initial-backup" ? backupInfoContent : exportInfoContent}
    </PromptToReveal>
  )
}

export default React.memo(ExportKeyDialog)
