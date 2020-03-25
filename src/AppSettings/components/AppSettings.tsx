import React from "react"
import { useTranslation } from "react-i18next"
import List from "@material-ui/core/List"
import { availableLanguages } from "../../../i18n/index"
import { AccountsContext } from "~App/contexts/accounts"
import { SettingsContext } from "~App/contexts/settings"
import * as routes from "~App/routes"
import { useIsMobile, useRouter } from "~Generic/hooks/userinterface"
import { matchesRoute } from "~Generic/lib/routes"
import Carousel from "~Layout/components/Carousel"
import ManageTrustedServicesDialog from "./ManageTrustedServicesDialog"
import {
  BiometricLockSetting,
  HideMemoSetting,
  LanguageSetting,
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
  const { i18n } = useTranslation()

  const showSettingsOverview = matchesRoute(router.location.pathname, routes.settings(), true)

  const { accounts } = React.useContext(AccountsContext)
  const settings = React.useContext(SettingsContext)
  const trustedServicesEnabled = process.env.TRUSTED_SERVICES && process.env.TRUSTED_SERVICES === "enabled"

  const getEffectiveLanguage = <L extends string | undefined, F extends any>(lang: L, fallback: F) => {
    return availableLanguages.indexOf(lang as any) > -1 ? lang : fallback
  }

  const hasTestnetAccount = accounts.some(account => account.testnet)
  const navigateToTrustedServices = React.useCallback(() => router.history.push(routes.manageTrustedServices()), [
    router.history
  ])

  const switchLanguage = React.useCallback(
    (lang: string | undefined) => {
      i18n.changeLanguage(getEffectiveLanguage(lang || navigator.language.substr(0, 2), "en"))
      settings.setLanguage(lang)
    },
    [i18n, settings]
  )

  return (
    <Carousel current={showSettingsOverview ? 0 : 1}>
      <List style={{ padding: isSmallScreen ? 0 : "24px 16px" }}>
        {availableLanguages.length > 1 ? (
          <LanguageSetting onSelect={switchLanguage} value={getEffectiveLanguage(settings.language, undefined)} />
        ) : null}
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
