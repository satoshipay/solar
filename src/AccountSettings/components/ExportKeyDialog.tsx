import React from "react"
import { useTranslation } from "react-i18next"
import QRCode from "qrcode.react"
import Button from "@material-ui/core/Button"
import InputAdornment from "@material-ui/core/InputAdornment"
import Typography from "@material-ui/core/Typography"
import LockIcon from "@material-ui/icons/LockOutlined"
import LockOpenIcon from "@material-ui/icons/LockOpenOutlined"
import LockFilledIcon from "@material-ui/icons/Lock"
import { makeStyles } from "@material-ui/core/styles"
import PrintIcon from "@material-ui/icons/Print"
import WarnIcon from "@material-ui/icons/Warning"
import KeyExportBox from "~Account/components/KeyExportBox"
import { Account } from "~App/contexts/accounts"
import { trackError } from "~App/contexts/notifications"
import SolarIcon from "~Icons/components/Solar"
import ButtonIconLabel from "~Generic/components/ButtonIconLabel"
import { useIsMobile } from "~Generic/hooks/userinterface"
import MainTitle from "~Generic/components/MainTitle"
import PasswordField from "~Generic/components/PasswordField"
import { isWrongPasswordError, getErrorTranslation } from "~Generic/lib/errors"
import { ActionButton, DialogActionsBox } from "~Generic/components/DialogActions"
import { Box } from "~Layout/components/Box"
import DialogBody from "~Layout/components/DialogBody"
import { print } from "~Platform/print"

const printOptions =
  process.env.PLATFORM === "ios" || process.env.PLATFORM === "android"
    ? {
        name: "Solar Wallet Paper Backup",
        orientation: "landscape",
        pageCount: 1
      }
    : {}

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
  const { t } = useTranslation()

  return (
    <DialogBody
      background={<WarnIcon style={{ fontSize: 220 }} />}
      noMaxWidth
      preventNotchSpacing
      top={props.title}
      actions={
        <DialogActionsBox desktopStyle={{ marginTop: 32 }} smallDialog>
          <ActionButton icon={<LockOpenIcon />} onClick={props.onReveal} type="primary">
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

const useBackupPrintStyles = makeStyles(() => ({
  icon: {
    color: "black",
    width: 80,
    height: 80
  },
  keyTypography: {
    paddingTop: 16,
    wordBreak: "break-word",
    maxWidth: "300px"
  },
  accountName: {
    paddingTop: 8,
    marginBottom: 16
  },
  printContainer: {
    paddingTop: 16,
    paddingBottom: 16,
    display: "none",

    "@media print": {
      display: "block",
      borderStyle: "groove"
    }
  },
  qrContainer: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    textAlign: "center"
  },
  qrWrapper: {
    padding: 32,
    display: "flex",
    flexDirection: "column"
  },
  qrCaption: {
    paddingLeft: 8,
    paddingRight: 8,
    writingMode: "vertical-lr"
  }
}))

interface BackupPrintContainerProps {
  accountName?: string
  publicKey?: string
  secretKey: string
}

function BackupPrintContainer(props: BackupPrintContainerProps) {
  const classes = useBackupPrintStyles()

  return (
    <Box className={classes.printContainer}>
      <Typography align="center" className={classes.accountName} variant="h3">
        {props.accountName ? `${props.accountName}` : undefined}
      </Typography>
      <div className={classes.qrContainer}>
        {props.publicKey && (
          <div className={classes.qrWrapper}>
            <div style={{ display: "flex", flexDirection: "row", justifyContent: "flex-start" }}>
              <Typography className={classes.qrCaption} variant="h4">
                Public Key
              </Typography>
              <QRCode value={props.publicKey} size={200} />
            </div>
            <Typography className={classes.keyTypography}>{props.publicKey}</Typography>
          </div>
        )}
        <div style={{ alignSelf: "center" }}>
          <SolarIcon className={classes.icon} />
          <Typography>Solar Wallet</Typography>
          <Typography>Paper Backup</Typography>
        </div>
        <div className={classes.qrWrapper}>
          <div style={{ display: "flex", flexDirection: "row", justifyContent: "flex-end" }}>
            <QRCode value={props.secretKey} size={200} />
            <Typography className={classes.qrCaption} variant="h4">
              Secret Key
            </Typography>
          </div>
          <Typography className={classes.keyTypography}>{props.secretKey}</Typography>
        </div>
      </div>
      <Typography align="center">
        This is a backup of your account. <br /> Make sure to keep it in a safe place because anyone who has access to
        it can access your account.
      </Typography>
    </Box>
  )
}

const useSecretKeyStyles = makeStyles(() => ({
  noPrint: {
    "@media print": {
      display: "none"
    }
  }
}))

interface ShowSecretKeyProps {
  accountName?: string
  publicKey?: string
  secretKey: string
  onConfirm?: () => void
  title: React.ReactNode
  variant: Props["variant"]
}

function ShowSecretKey(props: ShowSecretKeyProps) {
  const classes = useSecretKeyStyles()
  const { t } = useTranslation()

  return (
    <DialogBody
      background={<LockFilledIcon style={{ fontSize: 220 }} />}
      noMaxWidth
      preventNotchSpacing
      top={<span className={classes.noPrint}>{props.title}</span>}
      actions={
        props.onConfirm ? (
          <DialogActionsBox className={classes.noPrint} desktopStyle={{ marginTop: 32 }} smallDialog>
            {props.variant === "initial-backup" ? (
              <ActionButton onClick={() => print(printOptions)} type="secondary">
                <ButtonIconLabel label={t("account-settings.export-key.action.print")}>
                  <PrintIcon />
                </ButtonIconLabel>
              </ActionButton>
            ) : (
              undefined
            )}
            <ActionButton onClick={props.onConfirm} type="primary">
              {t("account-settings.export-key.action.confirm")}
            </ActionButton>
          </DialogActionsBox>
        ) : null
      }
    >
      {props.variant === "initial-backup" ? (
        <Typography
          align="center"
          className={classes.noPrint}
          component="p"
          variant="h6"
          style={{ marginTop: -8, marginBottom: 16 }}
        >
          {t("account-settings.export-key.info.secret-key")}
        </Typography>
      ) : null}
      <Box className={classes.noPrint} padding="32px 0 0">
        <KeyExportBox export={props.secretKey} hideTapToCopy={props.variant === "initial-backup"} size={192} />
      </Box>
      <BackupPrintContainer accountName={props.accountName} publicKey={props.publicKey} secretKey={props.secretKey} />
    </DialogBody>
  )
}

export const useExportKeyDialogStyles = makeStyles(theme => ({
  noPrint: {
    "@media print": {
      display: "none"
    }
  }
}))

interface Props {
  account: Account | null | undefined
  onClose?: () => void
  onConfirm?: () => void
  variant: "export" | "initial-backup"
}

function ExportKeyDialog(props: Props) {
  const classes = useExportKeyDialogStyles()

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

  const onPrint = React.useCallback(() => {
    if (secretKey) {
      print(printOptions)
    }
  }, [secretKey])

  const actions = React.useMemo(() => {
    return isRevealed ? (
      <Button className={classes.noPrint} color="primary" onClick={onPrint} variant="contained">
        <ButtonIconLabel label={t("account-settings.export-key.action.print")}>
          <PrintIcon />
        </ButtonIconLabel>
      </Button>
    ) : (
      undefined
    )
  }, [classes, isRevealed, onPrint, t])

  const titleContent = React.useMemo(
    () =>
      props.variant === "initial-backup" ? null : (
        <MainTitle
          actions={actions}
          hideBackButton
          onBack={onBackButtonClick}
          style={{ marginBottom: 24 }}
          title={t("account-settings.export-key.title.default")}
        />
      ),
    [actions, props.variant, onBackButtonClick, t]
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
      accountName={props.account?.name}
      secretKey={secretKey}
      publicKey={props.account?.publicKey}
      onConfirm={props.onConfirm}
      title={titleContent}
      variant={props.variant}
    />
  ) : (
    <PromptToReveal
      onReveal={reveal}
      password={password}
      passwordError={passwordError ? new Error(getErrorTranslation(passwordError, t)) : null}
      requiresPassword={Boolean(props.account && props.account.requiresPassword)}
      title={titleContent}
      updatePassword={updatePassword}
    >
      {props.variant === "initial-backup" ? backupInfoContent : exportInfoContent}
    </PromptToReveal>
  )
}

export default React.memo(ExportKeyDialog)
