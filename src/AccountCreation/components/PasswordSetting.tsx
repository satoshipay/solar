import React from "react"
import { useTranslation } from "react-i18next"
import Collapse from "@material-ui/core/Collapse"
import ListItemText from "@material-ui/core/ListItemText"
import Switch from "@material-ui/core/Switch"
import AccountSettingsItem from "~AccountSettings/components/AccountSettingsItem"
import PasswordField from "~Generic/components/PasswordField"

interface PasswordSettingProps {
  error?: string
  password: string
  onEnterPassword: (password: string) => void
  onRepeatPassword: (password: string) => void
  onTogglePassword: () => void
  repeatedPassword: string
  requiresPassword: boolean
}

function PasswordSetting(props: PasswordSettingProps) {
  const { t } = useTranslation()

  return (
    <>
      <AccountSettingsItem
        caret={props.requiresPassword ? "down" : "right"}
        icon={<Switch checked={props.requiresPassword} color="primary" onChange={props.onTogglePassword} />}
        onClick={props.onTogglePassword}
      >
        <ListItemText
          primary={t("create-account.options.password.label")}
          secondary={
            props.requiresPassword
              ? t("create-account.options.password.protected")
              : t("create-account.options.password.unprotected")
          }
          style={{ marginLeft: 8 }}
        />
      </AccountSettingsItem>
      <Collapse in={props.requiresPassword}>
        <AccountSettingsItem icon={null} subItem>
          <ListItemText style={{ marginLeft: 12, marginRight: 56, marginTop: -8 }}>
            <PasswordField
              error={Boolean(props.error)}
              fullWidth
              label={t("create-account.inputs.password.label")}
              margin="normal"
              onChange={event => props.onEnterPassword(event.target.value)}
              placeholder={t("create-account.inputs.password.placeholder")}
              value={props.password}
            />
            <PasswordField
              error={Boolean(props.error)}
              fullWidth
              helperText={props.error}
              label={t("create-account.inputs.password-repeat.label")}
              margin="normal"
              onChange={event => props.onRepeatPassword(event.target.value)}
              placeholder={t("create-account.inputs.password-repeat.placeholder")}
              value={props.repeatedPassword}
            />
          </ListItemText>
        </AccountSettingsItem>
      </Collapse>
    </>
  )
}

export default React.memo(PasswordSetting)
