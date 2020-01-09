import React from "react"
import Card from "@material-ui/core/Card"
import CardContent from "@material-ui/core/CardContent"
import Typography from "@material-ui/core/Typography"
import { AccountsContext } from "../context/accounts"
import { SettingsContext } from "../context/settings"
import { Box, VerticalLayout } from "../components/Layout/Box"
import MainTitle from "../components/MainTitle"
import ToggleSection from "../components/Layout/ToggleSection"
import { Section } from "../components/Layout/Page"
import { useIsMobile, useRouter } from "../hooks/userinterface"
import { useTranslation } from "../hooks/i18n"
import { biometricLockAvailable } from "../platform/settings"
import * as routes from "../routes"

// tslint:disable-next-line
const pkg = require("../../package.json")

function Settings() {
  const { accounts } = React.useContext(AccountsContext)
  const settings = React.useContext(SettingsContext)
  const hasTestnetAccount = accounts.some(account => account.testnet)
  const [bioLockAvailable, setBioLockAvailable] = React.useState(false)
  const { t } = useTranslation()

  React.useEffect(() => {
    biometricLockAvailable().then(setBioLockAvailable)
  }, [biometricLockAvailable])

  return (
    <>
      <ToggleSection
        disabled={!settings.biometricLockUsable}
        checked={settings.biometricLock && settings.biometricLockUsable}
        onChange={settings.toggleBiometricLock}
        style={bioLockAvailable ? {} : { display: "none" }}
        title={
          process.env.PLATFORM === "ios"
            ? t("settings-page.biometric-lock-title-ios")
            : t("settings-page.biometric-lock-title")
        }
      >
        <Typography
          color={settings.biometricLock ? "initial" : "textSecondary"}
          style={{ margin: "8px 0 0" }}
          variant="body2"
        >
          {t("settings-page.biometric-lock-description")}
        </Typography>
      </ToggleSection>
      <ToggleSection
        checked={settings.showTestnet}
        disabled={hasTestnetAccount}
        onChange={settings.toggleTestnet}
        title={t("settings-page.show-testnet-accounts-title")}
      >
        <Typography
          color={settings.showTestnet ? "initial" : "textSecondary"}
          style={{ margin: "8px 0 0" }}
          variant="body2"
        >
          {t("settings-page.show-testnet-accounts-description-1")}
        </Typography>
        <Typography
          color={settings.showTestnet ? "initial" : "textSecondary"}
          style={{ margin: "12px 0 0" }}
          variant="body2"
        >
          {t("settings-page.show-testnet-accounts-description-2")}
        </Typography>
      </ToggleSection>
      <ToggleSection
        checked={settings.hideMemos}
        onChange={settings.toggleHideMemos}
        title={t("settings-page.hide-memos-title")}
      >
        <Typography
          color={settings.hideMemos ? undefined : "textSecondary"}
          style={{ margin: "8px 0 0" }}
          variant="body2"
        >
          {t("settings-page.hide-memos-description")}
        </Typography>
      </ToggleSection>
      <ToggleSection
        checked={settings.multiSignature}
        onChange={settings.toggleMultiSignature}
        title={t("settings-page.enable-multi-sig-title")}
      >
        <Typography
          color={settings.multiSignature ? "initial" : "textSecondary"}
          style={{ margin: "8px 0 0" }}
          variant="body2"
        >
          {t("settings-page.enable-multi-sig-description")}
        </Typography>
      </ToggleSection>
    </>
  )
}

function SettingsPage() {
  const isSmallScreen = useIsMobile()
  const router = useRouter()
  const { t } = useTranslation()

  return (
    <>
      <Section top brandColored style={{ flexGrow: 0 }}>
        <Card
          style={{
            color: "white",
            position: "relative",
            background: "transparent",
            boxShadow: "none"
          }}
        >
          <CardContent style={{ paddingTop: 16, paddingBottom: 16 }}>
            <MainTitle
              onBack={() => router.history.push(routes.allAccounts())}
              style={{ margin: "-12px 0 -10px", minHeight: 56 }}
              title={t("settings-page.main-title")}
              titleColor="inherit"
            />
          </CardContent>
        </Card>
      </Section>
      <Section bottom style={{ display: "flex", paddingTop: 0, flexDirection: "column", overflowY: "auto" }}>
        <VerticalLayout height="100%" padding="0 8px" grow>
          <Box grow margin={isSmallScreen ? "0 -8px" : "24px 4px"} padding="0 8px" overflowY="auto">
            <Settings />
          </Box>
          <Box grow={0} margin="16px 0 0">
            <Typography align="center" color="textSecondary">
              v{pkg.version}
            </Typography>
          </Box>
        </VerticalLayout>
      </Section>
    </>
  )
}

export default SettingsPage
