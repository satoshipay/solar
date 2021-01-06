import React from "react"
import { useTranslation } from "react-i18next"
import InputAdornment from "@material-ui/core/InputAdornment"
import Typography from "@material-ui/core/Typography"
import LockIcon from "@material-ui/icons/LockOutlined"
import LockOpenIcon from "@material-ui/icons/LockOpenOutlined"
import LockFilledIcon from "@material-ui/icons/Lock"
import WarnIcon from "@material-ui/icons/Warning"
import KeyExportBox from "~Account/components/KeyExportBox"
import { Account } from "~App/contexts/accounts"
import { trackError } from "~App/contexts/notifications"
import { useIsMobile } from "~Generic/hooks/userinterface"
import MainTitle from "~Generic/components/MainTitle"
import PasswordField from "~Generic/components/PasswordField"
import { isWrongPasswordError, getErrorTranslation } from "~Generic/lib/errors"
import { ActionButton, DialogActionsBox } from "~Generic/components/DialogActions"
import { Box } from "~Layout/components/Box"
import DialogBody from "~Layout/components/DialogBody"

interface PromptToRevealProps {
  children: React.ReactNode
  password: string
  passwordError: Error | null
  requiresPassword: boolean
  testnet?: boolean
  title: React.ReactNode
  onReveal: (event: React.SyntheticEvent) => void
  updatePassword: (event: React.ChangeEvent<HTMLInputElement>) => void
}

function PromptToReveal(props: PromptToRevealProps) {
  const isSmallScreen = useIsMobile()
  const { t } = useTranslation()

  return (
    <DialogBody
      background={<WarnIcon style={{ fontSize: 220 }} />}
      noMaxWidth
      preventNotchSpacing
      top={props.title}
      actions={
        <DialogActionsBox desktopStyle={{ marginTop: 32 }} smallDialog>
          <ActionButton icon={<LockOpenIcon />} onClick={props.onReveal} testnet={props.testnet} type="primary">
            {isSmallScreen
              ? t("account-settings.export-key.action.reveal.short")
              : t("account-settings.export-key.action.reveal.long")}
          </ActionButton>
        </DialogActionsBox>
      }
    >
      {props.children}
      <form noValidate onSubmit={props.onReveal}>
        {props.requiresPassword ? (
          <PasswordField
            autoFocus={process.env.PLATFORM !== "ios"}
            fullWidth
            error={props.passwordError !== null}
            label={
              props.passwordError
                ? props.passwordError.message
                : t("account-settings.export-key.textfield.password.label")
            }
            margin="dense"
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
  testnet?: boolean
  title: React.ReactNode
  variant: Props["variant"]
}

function ShowSecretKey(props: ShowSecretKeyProps) {
  const { t } = useTranslation()

  return (
    <DialogBody
      background={<LockFilledIcon style={{ fontSize: 220 }} />}
      noMaxWidth
      preventNotchSpacing
      top={props.title}
      actions={
        props.onConfirm ? (
          <DialogActionsBox desktopStyle={{ marginTop: 32 }} smallDialog>
            <ActionButton onClick={props.onConfirm} testnet={props.testnet} type="primary">
              {t("account-settings.export-key.action.confirm")}
            </ActionButton>
          </DialogActionsBox>
        ) : null
      }
    >
      {props.variant === "initial-backup" ? (
        <Typography align="center" component="p" variant="h6" style={{ marginTop: -8, marginBottom: 16 }}>
          {t("account-settings.export-key.info.secret-key")}
        </Typography>
      ) : null}
      <Box padding={"32px 0 0"}>
        <KeyExportBox export={props.export} hideTapToCopy={props.variant === "initial-backup"} size={192} />
      </Box>
    </DialogBody>
  )
}

interface Props {
  account: Account | null | undefined
  onClose?: () => void
  onConfirm?: () => void
  variant: "export" | "initial-backup"
}

function ExportKeyDialog(props: Props) {
  const [password, setPassword] = React.useState("")
  const [passwordError, setPasswordError] = React.useState<Error | null>(null)
  const [isRevealed, setIsRevealed] = React.useState(false)
  const [secretKey, setSecretKey] = React.useState<string | null>(null)
  const { t } = useTranslation()

  const onBackButtonClick = React.useCallback(props.onClose || (() => undefined), [props.onClose])

  const reveal = props.account
    ? (event: React.SyntheticEvent) => {
        event.preventDefault()

        const passwordToUse = props.account!.requiresPassword ? password : null

        props
          .account!.getPrivateKey(passwordToUse)
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
    : () => undefined

  const updatePassword = React.useCallback(
    (event: React.SyntheticEvent<HTMLInputElement>) => setPassword(event.currentTarget.value),
    []
  )

  const titleContent = React.useMemo(
    () =>
      props.variant === "initial-backup" ? null : (
        <MainTitle
          hideBackButton
          onBack={onBackButtonClick}
          style={{ marginBottom: 24 }}
          title={t("account-settings.export-key.title.default")}
        />
      ),
    [props.variant, onBackButtonClick, t]
  )

  const backupInfoContent = React.useMemo(
    () => (
      <Box fontSize="18px" margin="24px 0 0">
        <Typography component="p" variant="h5">
          {t("account-settings.export-key.info.backup.title")}
        </Typography>
        <Typography component="p" variant="body1" style={{ fontSize: "inherit", margin: "24px 0" }}>
          {t("account-settings.export-key.info.backup.paragraph-1")}
        </Typography>
        <Typography component="p" variant="body1" style={{ fontSize: "inherit", margin: "24px 0" }}>
          {t("account-settings.export-key.info.backup.paragraph-2")}
        </Typography>
      </Box>
    ),
    [t]
  )

  const exportInfoContent = React.useMemo(
    () => (
      <Box margin="24px 0 0">
        <Typography component="p" variant="body1">
          {t("account-settings.export-key.info.export.paragraph-1")}
        </Typography>
        <Typography component="p" variant="body1" style={{ margin: "24px 0" }}>
          {t("account-settings.export-key.info.export.paragraph-2")}
        </Typography>
      </Box>
    ),
    [t]
  )

  return isRevealed && secretKey ? (
    <ShowSecretKey
      export={secretKey}
      onConfirm={props.onConfirm}
      testnet={props.account?.testnet}
      title={titleContent}
      variant={props.variant}
    />
  ) : (
    <PromptToReveal
      onReveal={reveal}
      password={password}
      passwordError={passwordError ? new Error(getErrorTranslation(passwordError, t)) : null}
      requiresPassword={Boolean(props.account && props.account.requiresPassword)}
      testnet={props.account?.testnet}
      title={titleContent}
      updatePassword={updatePassword}
    >
      {props.variant === "initial-backup" ? backupInfoContent : exportInfoContent}
    </PromptToReveal>
  )
}

export default React.memo(ExportKeyDialog)
