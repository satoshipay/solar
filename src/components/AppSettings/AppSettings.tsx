import React from "react"
import List from "@material-ui/core/List"
import { AccountsContext } from "../../context/accounts"
import { SettingsContext } from "../../context/settings"
import { useIsMobile, useRouter } from "../../hooks/userinterface"
import { matchesRoute } from "../../lib/routes"
import * as routes from "../../routes"
import Carousel from "../Layout/Carousel"
import ManageTrustedServicesDialog from "./ManageTrustedServicesDialog"
import {
  BiometricLockSetting,
  HideMemoSetting,
  MultiSigSetting,
  TestnetSetting,
  TrustedServicesSetting
} from "./Settings"

const SettingsDialogs = React.memo(function SettingsDialogs() {
  const router = useRouter()
  const showManageTrustedServices = matchesRoute(router.location.pathname, routes.manageTrustedServices())

  return showManageTrustedServices ? <ManageTrustedServicesDialog /> : <></>
})

function AppSettings() {
  const isSmallScreen = useIsMobile()
  const router = useRouter()

  const showSettingsOverview = matchesRoute(router.location.pathname, routes.settings(), true)

  const { accounts } = React.useContext(AccountsContext)
  const settings = React.useContext(SettingsContext)

  const hasTestnetAccount = accounts.some(account => account.testnet)
  const navigateToTrustedServices = React.useCallback(() => router.history.push(routes.manageTrustedServices()), [
    router.history
  ])

  const trustedServicesEnabled = process.env.TRUSTED_SERVICES && process.env.TRUSTED_SERVICES === "enabled"

  return (
    <Carousel current={showSettingsOverview ? 0 : 1}>
      <List style={{ padding: isSmallScreen ? 0 : "24px 16px" }}>
        {settings.biometricAvailability.available ? (
          <BiometricLockSetting
            enrolled={settings.biometricAvailability.enrolled}
            onToggle={settings.toggleBiometricLock}
            value={settings.biometricLock}
          />
        ) : null}
        <TestnetSetting
          hasTestnetAccount={hasTestnetAccount}
          onToggle={settings.toggleTestnet}
          value={settings.showTestnet || hasTestnetAccount}
        />
        <HideMemoSetting onToggle={settings.toggleHideMemos} value={settings.hideMemos} />
        <MultiSigSetting onToggle={settings.toggleMultiSignature} value={settings.multiSignature} />
        {trustedServicesEnabled ? <TrustedServicesSetting onClick={navigateToTrustedServices} /> : undefined}
      </List>
      <SettingsDialogs />
    </Carousel>
  )
}

export default React.memo(AppSettings)
