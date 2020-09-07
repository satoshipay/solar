import React from "react"
import { useTranslation } from "react-i18next"
import Button from "@material-ui/core/Button"
import { makeStyles } from "@material-ui/core"
import InputAdornment from "@material-ui/core/InputAdornment"
import ListItemText from "@material-ui/core/ListItemText"
import TextField from "@material-ui/core/TextField"
import RestoreIcon from "@material-ui/icons/SettingsBackupRestore"
import { breakpoints } from "~App/theme"
import AccountSettingsItem from "~AccountSettings/components/AccountSettingsItem"
import { QRReader } from "~Generic/components/FormFields"

const useStyles = makeStyles(() => ({
  headerItem: {
    marginLeft: 8
  },
  subItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    marginLeft: 12,
    marginRight: 56,
    marginTop: -8
  },
  textField: {
    width: "100%"
  },
  toggleButton: {
    padding: 16,
    margin: 8,

    [breakpoints.down(600)]: {
      width: "100%"
    }
  }
}))

interface SecretKeyImportProps {
  error?: string
  onEnterMnemonic: (mnemonic: string) => void
  onEnterSecretKey: (secretKey: string) => void
  onToggleUseMnemonic: (useMnemonic: boolean) => void
  secretKey: string
  mnemonic: string
  useMnemonic: boolean
}

function SecretKeyImport(props: SecretKeyImportProps) {
  const { onEnterMnemonic, onEnterSecretKey, onToggleUseMnemonic } = props
  const classes = useStyles()
  const { t } = useTranslation()

  const inputProps = React.useMemo(
    () => ({
      style: { textOverflow: "ellipsis" }
    }),
    []
  )

  const InputProps = React.useMemo(
    () => ({
      endAdornment: (
        <InputAdornment disableTypography position="end">
          <QRReader onScan={onEnterSecretKey} />
        </InputAdornment>
      )
    }),
    [onEnterSecretKey]
  )

  const MnemonicTextField = React.useMemo(
    () => (
      <TextField
        className={classes.textField}
        error={Boolean(props.error)}
        helperText={props.error ? t("create-account.inputs.import.mnemonic.helper-text") : ""}
        label={props.error || t("create-account.inputs.import.mnemonic.label")}
        placeholder={t("create-account.inputs.import.mnemonic.placeholder")}
        fullWidth
        margin="normal"
        multiline
        value={props.mnemonic}
        onChange={event => onEnterMnemonic(event.target.value)}
        inputProps={inputProps}
        InputProps={InputProps}
      />
    ),
    [classes, inputProps, InputProps, onEnterMnemonic, props.error, props.mnemonic, t]
  )

  const SecretKeyTextField = React.useMemo(
    () => (
      <TextField
        className={classes.textField}
        error={Boolean(props.error)}
        helperText={props.error ? t("create-account.inputs.import.secret-key.helper-text") : ""}
        label={props.error || t("create-account.inputs.import.secret-key.label")}
        placeholder={t("create-account.inputs.import.secret-key.placeholder")}
        fullWidth
        margin="normal"
        value={props.secretKey}
        onChange={event => onEnterSecretKey(event.target.value.trim())}
        inputProps={inputProps}
        InputProps={InputProps}
      />
    ),
    [classes, inputProps, InputProps, onEnterSecretKey, props.error, props.secretKey, t]
  )

  const ToggleInputButton = React.useMemo(
    () => (
      <Button
        className={classes.toggleButton}
        onClick={() => onToggleUseMnemonic(!props.useMnemonic)}
        variant="outlined"
      >
        {props.useMnemonic
          ? t("create-account.inputs.import.toggle-method.use-secret-key")
          : t("create-account.inputs.import.toggle-method.use-mnemonic")}
      </Button>
    ),
    [classes, onToggleUseMnemonic, props.useMnemonic, t]
  )

  return (
    <>
      <AccountSettingsItem icon={<RestoreIcon />}>
        <ListItemText
          className={classes.headerItem}
          primary={t(`create-account.options.import.label.${props.useMnemonic ? "mnemonic" : "secret-key"}`)}
          secondary={t(`create-account.options.import.description.${props.useMnemonic ? "mnemonic" : "secret-key"}`)}
        />
      </AccountSettingsItem>
      <AccountSettingsItem icon={null} subItem>
        <ListItemText primaryTypographyProps={{ className: classes.subItem }}>
          {props.useMnemonic ? MnemonicTextField : SecretKeyTextField}
          {ToggleInputButton}
        </ListItemText>
      </AccountSettingsItem>
    </>
  )
}

export default React.memo(SecretKeyImport)
