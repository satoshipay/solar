import React from "react"
import List from "@material-ui/core/List"
import Switch from "@material-ui/core/Switch"
import FingerprintIcon from "@material-ui/icons/Fingerprint"
import GroupIcon from "@material-ui/icons/Group"
import MessageIcon from "@material-ui/icons/Message"
import TestnetIcon from "@material-ui/icons/Language"
import { AccountsContext } from "../../context/accounts"
import { SettingsContext } from "../../context/settings"
import { useIsMobile } from "../../hooks/userinterface"
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

  return (
    <>
      <Switch checked={checked} color="primary" disabled={disabled} onChange={handleChange} />
    </>
  )
}

function AppSettings() {
  const isSmallScreen = useIsMobile()

  const { accounts } = React.useContext(AccountsContext)
  const settings = React.useContext(SettingsContext)

  const hasTestnetAccount = accounts.some(account => account.testnet)

  return (
    <>
      <List style={{ padding: isSmallScreen ? 0 : "24px 16px" }}>
        <AppSettingsItem
          actions={
            <SettingsToggle
              checked={settings.biometricLock && settings.biometricLockUsable}
              disabled={!settings.biometricLockUsable}
              onChange={settings.toggleBiometricLock}
            />
          }
          disabled={!settings.biometricLockUsable}
          icon={<FingerprintIcon style={{ fontSize: "100%" }} />}
          onClick={settings.toggleBiometricLock}
          primaryText="Biometric authentication"
          secondaryText={
            settings.biometricLockUsable
              ? settings.biometricLock
                ? "Biometric authentication is enabled"
                : "Biometric authentication is disabled"
              : "Not available for your device"
          }
        />
        <AppSettingsItem
          actions={
            <SettingsToggle
              checked={settings.showTestnet}
              disabled={hasTestnetAccount}
              onChange={settings.toggleTestnet}
            />
          }
          disabled={hasTestnetAccount}
          icon={<TestnetIcon style={{ fontSize: "100%" }} />}
          onClick={settings.toggleTestnet}
          primaryText="Show Testnet Accounts"
          secondaryText={
            hasTestnetAccount
              ? "Cannot be disabled because you added testnet accounts already"
              : settings.showTestnet
              ? "Testnet accounts are shown"
              : "Testnet accounts are hidden"
          }
        />
        <AppSettingsItem
          actions={<SettingsToggle checked={!settings.hideMemos} onChange={settings.toggleHideMemos} />}
          icon={<MessageIcon style={{ fontSize: "100%" }} />}
          onClick={settings.toggleHideMemos}
          primaryText="Show Memos"
          secondaryText={
            settings.hideMemos
              ? "Memos are hidden in the transaction overview"
              : "Memos are shown in the transaction overview"
          }
        />
        <AppSettingsItem
          actions={<SettingsToggle checked={settings.multiSignature} onChange={settings.toggleMultiSignature} />}
          icon={<GroupIcon style={{ fontSize: "100%" }} />}
          onClick={settings.toggleMultiSignature}
          primaryText="Enable Multi-Signature"
          secondaryText={
            settings.multiSignature ? "Multi-Signature features are enabled" : "Multi-Signature features are disabled"
          }
        />
      </List>
    </>
  )
}

export default React.memo(AppSettings)
