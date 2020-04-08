import React from "react"
import { useTranslation } from "react-i18next"
import ListItemIcon from "@material-ui/core/ListItemIcon"
import MenuItem from "@material-ui/core/MenuItem"
import Select from "@material-ui/core/Select"
import Switch from "@material-ui/core/Switch"
import { makeStyles } from "@material-ui/core/styles"
import ArrowRightIcon from "@material-ui/icons/KeyboardArrowRight"
import FingerprintIcon from "@material-ui/icons/Fingerprint"
import GroupIcon from "@material-ui/icons/Group"
import LanguageIcon from "@material-ui/icons/Language"
import MessageIcon from "@material-ui/icons/Message"
import TestnetIcon from "@material-ui/icons/MoneyOff"
import TrustIcon from "@material-ui/icons/VerifiedUser"
import { availableLanguages } from "../../../i18n/index"
import AppSettingsItem from "./AppSettingsItem"

interface SettingsToggleProps {
  checked: boolean
  disabled?: boolean
  onChange: (checked: boolean) => void
}

function SettingsToggle(props: SettingsToggleProps) {
  const { checked, disabled, onChange } = props

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.checked)
  }

  return <Switch checked={checked} color="primary" disabled={disabled} onChange={handleChange} />
}

interface SettingProps {
  onToggle: () => void
  value: boolean
}

const useSettingsStyles = makeStyles({
  caret: {
    color: "rgba(0, 0, 0, 0.35)",
    fontSize: 48,
    justifyContent: "center",
    marginRight: -8,
    width: 48
  },
  icon: {
    fontSize: 28,
    justifyContent: "center",
    marginRight: 4,
    width: 28
  }
})

interface BiometricLockSettingProps {
  enrolled: boolean
  onToggle: () => void
  value: boolean
}

export const BiometricLockSetting = React.memo(function BiometricLockSetting(props: BiometricLockSettingProps) {
  const classes = useSettingsStyles(props)
  const { t } = useTranslation()
  return (
    <AppSettingsItem
      actions={
        <SettingsToggle checked={props.enrolled && props.value} disabled={!props.enrolled} onChange={props.onToggle} />
      }
      icon={<FingerprintIcon className={classes.icon} />}
      onClick={props.enrolled ? props.onToggle : undefined}
      primaryText={
        process.env.PLATFORM === "ios"
          ? t("app-settings.settings.biometric-lock.text.primary.ios")
          : t("app-settings.settings.biometric-lock.text.primary.default")
      }
      secondaryText={
        !props.enrolled
          ? t("app-settings.settings.biometric-lock.text.secondary.not-enrolled")
          : props.value
          ? t("app-settings.settings.biometric-lock.text.secondary.enabled")
          : t("app-settings.settings.biometric-lock.text.secondary.disabled")
      }
    />
  )
})

export const HideMemoSetting = React.memo(function HideMemoSetting(props: SettingProps) {
  const classes = useSettingsStyles(props)
  const { t } = useTranslation()
  return (
    <AppSettingsItem
      actions={<SettingsToggle checked={!props.value} onChange={props.onToggle} />}
      icon={<MessageIcon className={classes.icon} />}
      onClick={props.onToggle}
      primaryText={t("app-settings.settings.memo.text.primary")}
      secondaryText={
        props.value
          ? t("app-settings.settings.memo.text.secondary.hidden")
          : t("app-settings.settings.memo.text.secondary.shown")
      }
    />
  )
})

interface LanguageSettingProps {
  onSelect: (language: string | undefined) => void
  value: string | null | undefined
}

export const LanguageSetting = React.memo(function LanguageSetting(props: LanguageSettingProps) {
  const { onSelect } = props
  const classes = useSettingsStyles(props)
  const { t } = useTranslation()

  const handleChange = React.useCallback(
    (event: React.ChangeEvent<{ value: unknown }>) => {
      onSelect(event.target.value !== "auto" ? (event.target.value as string) : undefined)
    },
    [onSelect]
  )

  return (
    <AppSettingsItem
      actions={
        <Select onChange={handleChange} value={props.value || "auto"}>
          <MenuItem value="auto">{t("app-settings.settings.language.auto-detect.label")}</MenuItem>
          {[...availableLanguages].sort().map(lang => (
            <MenuItem key={lang} value={lang}>
              {lang}
            </MenuItem>
          ))}
        </Select>
      }
      icon={<LanguageIcon className={classes.icon} />}
      primaryText={t("app-settings.settings.language.text.primary")}
      secondaryText={t("app-settings.settings.language.text.secondary")}
    />
  )
})

export const MultiSigSetting = React.memo(function MultiSigSetting(props: SettingProps) {
  const classes = useSettingsStyles(props)
  const { t } = useTranslation()
  return (
    <AppSettingsItem
      actions={<SettingsToggle checked={props.value} onChange={props.onToggle} />}
      icon={<GroupIcon className={classes.icon} />}
      onClick={props.onToggle}
      primaryText={t("app-settings.settings.multi-sig.text.primary")}
      secondaryText={
        props.value
          ? t("app-settings.settings.multi-sig.text.secondary.enabled")
          : t("app-settings.settings.multi-sig.text.secondary.disabled")
      }
    />
  )
})

interface TestnetSettingProps {
  hasTestnetAccount: boolean
  onToggle: () => void
  value: boolean
}

export const TestnetSetting = React.memo(function TestnetSetting(props: TestnetSettingProps) {
  const classes = useSettingsStyles(props)
  const { t } = useTranslation()
  return (
    <AppSettingsItem
      actions={<SettingsToggle checked={props.value} disabled={props.hasTestnetAccount} onChange={props.onToggle} />}
      icon={<TestnetIcon className={classes.icon} />}
      onClick={props.hasTestnetAccount ? undefined : props.onToggle}
      primaryText={t("app-settings.settings.testnet.text.primary")}
      secondaryText={
        props.hasTestnetAccount
          ? t("app-settings.settings.testnet.text.secondary.cannot-disable")
          : props.value
          ? t("app-settings.settings.testnet.text.secondary.shown")
          : t("app-settings.settings.testnet.text.secondary.hidden")
      }
    />
  )
})

interface TrustedServicesSettingProps {
  onClick: () => void
}

export const TrustedServicesSetting = React.memo(function TrustedServicesSetting(props: TrustedServicesSettingProps) {
  const classes = useSettingsStyles(props)
  const { t } = useTranslation()
  return (
    <AppSettingsItem
      actions={
        <ListItemIcon className={classes.caret}>
          <ArrowRightIcon className={classes.caret} />
        </ListItemIcon>
      }
      icon={<TrustIcon className={classes.icon} />}
      onClick={props.onClick}
      primaryText={t("app-settings.settings.trusted-services.text.primary")}
      secondaryText={t("app-settings.settings.trusted-services.text.secondary")}
    />
  )
})
