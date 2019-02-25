import React from "react"
import { useContext } from "react"
import Card from "@material-ui/core/Card"
import CardContent from "@material-ui/core/CardContent"
import Typography from "@material-ui/core/Typography"
import { AccountsContext } from "../context/accounts"
import { SettingsContext } from "../context/settings"
import BackButton from "../components/BackButton"
import { Box, HorizontalLayout, VerticalLayout } from "../components/Layout/Box"
import ToggleSection from "../components/Layout/ToggleSection"
import { Section } from "../components/Layout/Page"
import { useRouter } from "../hooks"
import * as routes from "../routes"

// tslint:disable-next-line
const pkg = require("../../package.json")

function Settings() {
  const { accounts } = useContext(AccountsContext)
  const settings = useContext(SettingsContext)
  const hasTestnetAccount = accounts.some(account => account.testnet)
  return (
    <>
      <ToggleSection
        checked={settings.showTestnet}
        disabled={hasTestnetAccount}
        onChange={settings.toggleTestnet}
        title="Show Testnet Accounts"
      >
        <Typography
          color={settings.showTestnet ? "default" : "textSecondary"}
          style={{ margin: "12px 0 0" }}
          variant="body1"
        >
          The test network is a copy of the main Stellar network were the traded tokens have no real-world value. You
          can request free testnet XLM from the so-called friendbot to activate a testnet account and get started
          without owning any actual funds.
        </Typography>
        <Typography
          color={settings.showTestnet ? "default" : "textSecondary"}
          style={{ margin: "12px 0 0" }}
          variant="body1"
        >
          Note: Testnet accounts will always be shown if you have got testnet accounts already.
        </Typography>
      </ToggleSection>
      <ToggleSection
        checked={settings.multiSignature}
        onChange={settings.toggleMultiSignature}
        title="Enable Multi-Signature Features"
      >
        <Typography
          color={settings.multiSignature ? "default" : "textSecondary"}
          style={{ margin: "12px 0 0" }}
          variant="body1"
        >
          <b>Experimental feature:</b> Add co-signers to an account, define that all signers of an account have to sign
          transactions unanimously or a certain subset of signers have to sign a transaction in order to be valid.
        </Typography>
      </ToggleSection>
    </>
  )
}

function SettingsPage() {
  const router = useRouter()
  return (
    <>
      <Section top brandColored style={{ flexGrow: 0 }}>
        <Card
          style={{
            position: "relative",
            background: "transparent",
            boxShadow: "none"
          }}
        >
          <CardContent style={{ paddingTop: 16, paddingBottom: 16 }}>
            <HorizontalLayout alignItems="center" margin="-12px 0 -10px" minHeight={56}>
              <BackButton
                onClick={() => router.history.push(routes.allAccounts())}
                style={{ marginLeft: -10, marginRight: 10 }}
              />
              <Typography align="center" color="inherit" variant="headline" component="h2" style={{ marginRight: 20 }}>
                Settings
              </Typography>
            </HorizontalLayout>
          </CardContent>
        </Card>
      </Section>
      <Section style={{ display: "flex", flexDirection: "column" }}>
        <VerticalLayout height="100%" padding="0 8px" grow>
          <Box grow>
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
