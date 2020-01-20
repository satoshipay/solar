import React from "react"
import { useTranslation } from "react-i18next"
import Dialog from "@material-ui/core/Dialog"
import List from "@material-ui/core/List"
import Switch from "@material-ui/core/Switch"
import ArrowRightIcon from "@material-ui/icons/KeyboardArrowRight"
import FingerprintIcon from "@material-ui/icons/Fingerprint"
import GroupIcon from "@material-ui/icons/Group"
import MessageIcon from "@material-ui/icons/Message"
import TestnetIcon from "@material-ui/icons/MoneyOff"
import TrustIcon from "@material-ui/icons/VerifiedUser"
import { AccountsContext } from "../../context/accounts"
import { SettingsContext } from "../../context/settings"
import { useIsMobile, useRouter } from "../../hooks/userinterface"
import * as routes from "../../routes"
import { matchesRoute } from "../../lib/routes"
import { FullscreenDialogTransition } from "../../theme"
import AppSettingsItem from "./AppSettingsItem"
import ManageTrustedServicesDialog from "./ManageTrustedServicesDialog"
import { ListItemIcon } from "@material-ui/core"

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

function SettingsDialogs() {
  const router = useRouter()

  const showManageTrustedServices = matchesRoute(router.location.pathname, routes.manageTrustedServices())
  const navigateToSettings = React.useCallback(() => router.history.push(routes.settings()), [router.history])

  return (
    <Dialog
      fullScreen
      open={showManageTrustedServices}
      onClose={navigateToSettings}
      TransitionComponent={FullscreenDialogTransition}
    >
      <ManageTrustedServicesDialog onClose={navigateToSettings} />
    </Dialog>
  )
}

function AppSettings() {
  const isSmallScreen = useIsMobile()
  const { t } = useTranslation()
  const router = useRouter()

  const { accounts } = React.useContext(AccountsContext)
  const settings = React.useContext(SettingsContext)

  const hasTestnetAccount = accounts.some(account => account.testnet)
  const navigateToTrustedServices = React.useCallback(() => router.history.push(routes.manageTrustedServices()), [
    router.history
  ])

  return (
    <>
      <List style={{ padding: isSmallScreen ? 0 : "24px 16px" }}>
        {settings.biometricAvailability.available ? (
          <AppSettingsItem
            actions={
              <SettingsToggle
                checked={settings.biometricLock && settings.biometricAvailability.enrolled}
                disabled={!settings.biometricAvailability.enrolled}
                onChange={settings.toggleBiometricLock}
              />
            }
            icon={<FingerprintIcon style={{ fontSize: "100%" }} />}
            onClick={settings.biometricAvailability.enrolled ? settings.toggleBiometricLock : undefined}
            primaryText={t("app-settings.biometric-lock.text.primary")}
            secondaryText={
              !settings.biometricAvailability.enrolled
                ? t("app-settings.biometric-lock.text.secondary.not-enrolled")
                : settings.biometricLock
                ? t("app-settings.biometric-lock.text.secondary.enabled")
                : t("app-settings.biometric-lock.text.secondary.disabled")
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
              ? t("app-settings.testnet.text.secondary.cannot-disable")
              : settings.showTestnet
              ? t("app-settings.testnet.text.secondary.shown")
              : t("app-settings.testnet.text.secondary.hidden")
          }
        />
        <AppSettingsItem
          actions={<SettingsToggle checked={!settings.hideMemos} onChange={settings.toggleHideMemos} />}
          icon={<MessageIcon style={{ fontSize: "100%" }} />}
          onClick={settings.toggleHideMemos}
          primaryText={t("app-settings.memo.text.primary")}
          secondaryText={
            settings.hideMemos
              ? t("app-settings.memo.text.secondary.hidden")
              : t("app-settings.memo.text.secondary.shown")
          }
        />
        <AppSettingsItem
          actions={<SettingsToggle checked={settings.multiSignature} onChange={settings.toggleMultiSignature} />}
          icon={<GroupIcon style={{ fontSize: "100%" }} />}
          onClick={settings.toggleMultiSignature}
          primaryText={t("app-settings.multi-sig.text.primary")}
          secondaryText={
            settings.multiSignature
              ? t("app-settings.multi-sig.text.secondary.enabled")
              : t("app-settings.multi-sig.text.secondary.disabled")
          }
        />
        <AppSettingsItem
          actions={
            <ListItemIcon>
              <ArrowRightIcon style={{ fontSize: "100%" }} />
            </ListItemIcon>
          }
          icon={<TrustIcon style={{ fontSize: "100%" }} />}
          onClick={navigateToTrustedServices}
          primaryText={t("app-settings.trusted-services.text.primary")}
          secondaryText={t("app-settings.trusted-services.text.secondary")}
        />
      </List>
      <SettingsDialogs />
    </>
  )
}

export default React.memo(AppSettings)
