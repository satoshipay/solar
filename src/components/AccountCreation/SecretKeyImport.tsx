import React from "react"
import { useTranslation } from "react-i18next"
import InputAdornment from "@material-ui/core/InputAdornment"
import ListItemText from "@material-ui/core/ListItemText"
import TextField from "@material-ui/core/TextField"
import RestoreIcon from "@material-ui/icons/SettingsBackupRestore"
import AccountSettingsItem from "../AccountSettings/AccountSettingsItem"
import { QRReader } from "../Form/FormFields"

interface SecretKeyImportProps {
  error?: string
  onEnterSecretKey: (secretKey: string) => void
  secretKey: string
}

function SecretKeyImport(props: SecretKeyImportProps) {
  const { onEnterSecretKey } = props
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

  const handleInput = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onEnterSecretKey(event.target.value.trim())
    },
    [onEnterSecretKey]
  )

  return (
    <>
      <AccountSettingsItem caret="rotate-right" icon={<RestoreIcon />}>
        <ListItemText
          primary={t("create-account.options.import.label")}
          secondary={t("create-account.options.import.description")}
          style={{ marginLeft: 8 }}
        />
      </AccountSettingsItem>
      <AccountSettingsItem caret="hide" icon={null} subItem>
        <ListItemText style={{ marginLeft: 12, marginRight: 56, marginTop: -8 }}>
          <TextField
            error={Boolean(props.error)}
            helperText={props.error ? t("create-account.inputs.import.helper-text") : ""}
            label={props.error || t("create-account.inputs.import.label")}
            placeholder={t("create-account.inputs.import.placeholder")}
            fullWidth
            margin="normal"
            value={props.secretKey}
            onChange={handleInput}
            inputProps={inputProps}
            InputProps={InputProps}
          />
        </ListItemText>
      </AccountSettingsItem>
    </>
  )
}

export default React.memo(SecretKeyImport)
