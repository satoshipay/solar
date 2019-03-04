import React from "react"
import Button from "@material-ui/core/Button"
import IconButton from "@material-ui/core/IconButton"
import Typography from "@material-ui/core/Typography"
import SettingsIcon from "@material-ui/icons/Settings"
import TermsAndConditions from "../components/Dialog/TermsAndConditions"
import { Box, HorizontalLayout } from "../components/Layout/Box"
import { Section } from "../components/Layout/Page"
import AccountList from "../components/AccountList"
import { AccountsContext } from "../context/accounts"
import { SettingsContext } from "../context/settings"
import { useRouter } from "../hooks"
import * as routes from "../routes"

import { unstable_useMediaQuery as useMediaQuery } from "@material-ui/core/useMediaQuery"

function AllAccountsPage() {
  const { accounts, networkSwitch, toggleNetwork } = React.useContext(AccountsContext)
  const router = useRouter()
  const settings = React.useContext(SettingsContext)
  const testnetAccounts = accounts.filter(account => account.testnet)

  const isSmallScreen = useMediaQuery("(max-device-width:600px)")

  const networkSwitchButton = (
    <Button color="inherit" variant="outlined" onClick={toggleNetwork} style={{ borderColor: "white" }}>
      {isSmallScreen
        ? networkSwitch === "testnet"
          ? "Mainnet"
          : "Testnet"
        : networkSwitch === "testnet"
          ? "Switch to Mainnet"
          : "Switch to Testnet"}
    </Button>
  )
  return (
    <Section top brandColored>
      <Box margin="16px 24px" style={{ position: "relative" }}>
        <HorizontalLayout alignItems="center" wrap="wrap">
          <Typography
            color="inherit"
            variant="h5"
            style={
              isSmallScreen
                ? { flexGrow: 1, whiteSpace: "nowrap", alignSelf: "flex-end", minWidth: 200, paddingBottom: 8 }
                : { flexGrow: 1 }
            }
          >
            {networkSwitch === "testnet" ? "Testnet Accounts" : "My Accounts"}
          </Typography>
          <HorizontalLayout style={{ marginLeft: "auto" }}>
            <Box>
              {settings.showTestnet || networkSwitch === "testnet" || testnetAccounts.length > 0
                ? networkSwitchButton
                : null}
              <IconButton
                onClick={() => router.history.push(routes.settings())}
                style={{ marginLeft: 0, marginRight: 0, color: "inherit" }}
              >
                <SettingsIcon />
              </IconButton>
            </Box>
          </HorizontalLayout>
        </HorizontalLayout>
        <Box margin="16px 0 0">
          <AccountList
            accounts={accounts}
            testnet={networkSwitch === "testnet"}
            onCreatePubnetAccount={() => router.history.push(routes.createAccount(false))}
            onCreateTestnetAccount={() => router.history.push(routes.createAccount(true))}
          />
        </Box>
      </Box>
      <TermsAndConditions open={!settings.agreedToTermsAt} onConfirm={settings.confirmToC} />
    </Section>
  )
}

export default AllAccountsPage
