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

function AllAccountsPage() {
  const { accounts, networkSwitch, toggleNetwork } = React.useContext(AccountsContext)
  const router = useRouter()
  const settings = React.useContext(SettingsContext)
  const testnetAccounts = accounts.filter(account => account.testnet)

  const networkSwitchButton = (
    <Button color="inherit" variant="outlined" onClick={toggleNetwork} style={{ borderColor: "white" }}>
      {networkSwitch === "testnet" ? "Switch to Mainnet" : "Switch to Testnet"}
    </Button>
  )
  return (
    <Section top brandColored>
      <Box margin="16px 24px" style={{ position: "relative" }}>
        <HorizontalLayout alignItems="center">
          <Typography color="inherit" variant="headline" style={{ flexGrow: 1, marginRight: 180 }}>
            {networkSwitch === "testnet" ? "Testnet Accounts" : "My Accounts"}
          </Typography>
          <Box>
            {settings.showTestnet || networkSwitch === "testnet" || testnetAccounts.length > 0
              ? networkSwitchButton
              : null}
            <IconButton
              onClick={() => router.history.push(routes.settings())}
              style={{ marginLeft: 8, marginRight: -10, color: "inherit" }}
            >
              <SettingsIcon />
            </IconButton>
          </Box>
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
