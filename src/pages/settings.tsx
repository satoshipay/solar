import React from "react"
import Card from "@material-ui/core/Card"
import CardContent from "@material-ui/core/CardContent"
import Typography from "@material-ui/core/Typography"
import AppSettings from "../components/AppSettings/AppSettings"
import { Box, VerticalLayout } from "../components/Layout/Box"
import MainTitle from "../components/MainTitle"
import { Section } from "../components/Layout/Page"
import { useIsMobile, useRouter } from "../hooks/userinterface"
import { matchesRoute } from "../lib/routes"
import * as routes from "../routes"

// tslint:disable-next-line
const pkg = require("../../package.json")

function SettingsPage() {
  const isSmallScreen = useIsMobile()
  const router = useRouter()

  const showSettingsOverview = matchesRoute(router.location.pathname, routes.settings(), true)

  const navigateToAllAccounts = React.useCallback(() => {
    router.history.push(routes.allAccounts())
  }, [router.history])

  const navigateToSettingsOverview = React.useCallback(() => router.history.push(routes.settings()), [router.history])

  const headerCard = React.useMemo(
    () => (
      <Card
        style={{
          color: "white",
          position: "relative",
          background: "transparent",
          boxShadow: "none"
        }}
      >
        <CardContent style={{ padding: isSmallScreen ? 8 : undefined, paddingBottom: 8 }}>
          <MainTitle
            onBack={showSettingsOverview ? navigateToAllAccounts : navigateToSettingsOverview}
            title="Settings"
            titleColor="inherit"
            style={{ marginTop: -12, marginLeft: 0 }}
          />
        </CardContent>
      </Card>
    ),
    [isSmallScreen, navigateToAllAccounts, navigateToSettingsOverview, showSettingsOverview]
  )

  return (
    <VerticalLayout height="100%">
      <Section top brandColored grow={0} shrink={0}>
        {headerCard}
      </Section>
      <Section
        bottom={isSmallScreen}
        style={{
          backgroundColor: "#fcfcfc",
          height: "100%",
          flexGrow: 1,
          flexShrink: 1,
          padding: isSmallScreen ? undefined : "0 24px",
          overflowY: "auto"
        }}
      >
        <VerticalLayout height="100%" grow>
          <Box grow overflowY="auto">
            <AppSettings />
          </Box>
          <Box grow={0} margin="16px 0">
            <Typography align="center" color="textSecondary">
              v{pkg.version}
            </Typography>
          </Box>
        </VerticalLayout>
      </Section>
    </VerticalLayout>
  )
}

export default SettingsPage
