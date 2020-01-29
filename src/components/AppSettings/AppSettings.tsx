import React from "react"
import List from "@material-ui/core/List"
import Switch from "@material-ui/core/Switch"
import FingerprintIcon from "@material-ui/icons/Fingerprint"
import GroupIcon from "@material-ui/icons/Group"
import MessageIcon from "@material-ui/icons/Message"
import TestnetIcon from "@material-ui/icons/MoneyOff"
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

  const [biometricAuthAvailable, setBiometricAuthAvailable] = React.useState(false)
  const [biometricAuthEnrolled, setBiometricAuthEnrolled] = React.useState(false)

  React.useEffect(() => {
    if (settings.biometricAuthAvailability.available) {
      setBiometricAuthAvailable(true)
      setBiometricAuthEnrolled(true)
    } else {
      // code -106 means 'BIOMETRIC_NOT_ENROLLED' (cordova fingerprint plugin)
      // hence biometric auth is available but not currently set up
      if (settings.biometricAuthAvailability.code === -106) {
        setBiometricAuthAvailable(true)
      }
    }
  }, [settings.biometricAuthAvailability])

  const hasTestnetAccount = accounts.some(account => account.testnet)

  return (
    <>
      <List style={{ padding: isSmallScreen ? 0 : "24px 16px" }}>
        {biometricAuthAvailable ? (
          <AppSettingsItem
            actions={
              <SettingsToggle
                checked={settings.biometricLock && biometricAuthEnrolled}
                disabled={!biometricAuthEnrolled}
                onChange={settings.toggleBiometricLock}
              />
            }
            icon={<FingerprintIcon style={{ fontSize: "100%" }} />}
            onClick={biometricAuthEnrolled ? settings.toggleBiometricLock : undefined}
            primaryText="Biometric authentication"
            secondaryText={
              !biometricAuthEnrolled
                ? "Cannot be enabled because you are not enrolled in biometric authentication"
                : settings.biometricLock
                ? "Biometric authentication is enabled"
                : "Biometric authentication is disabled"
            }
          />
        ) : null}
        <AppSettingsItem
          actions={
            <SettingsToggle
              checked={settings.showTestnet}
              disabled={hasTestnetAccount}
              onChange={settings.toggleTestnet}
            />
          }
          icon={<TestnetIcon style={{ fontSize: "100%" }} />}
          onClick={hasTestnetAccount ? undefined : settings.toggleTestnet}
          primaryText="Show Testnet Accounts"
          secondaryText={
            hasTestnetAccount
              ? "Cannot be disabled because you already added testnet accounts"
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
