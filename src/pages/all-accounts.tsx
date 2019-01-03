import { History } from "history"
import React from "react"
import { useContext } from "react"
import { withRouter } from "react-router"
import Button from "@material-ui/core/Button"
import IconButton from "@material-ui/core/IconButton"
import Typography from "@material-ui/core/Typography"
import SettingsIcon from "@material-ui/icons/Settings"
import { Box } from "../components/Layout/Box"
import { Section } from "../components/Layout/Page"
import AccountList from "../components/AccountList"
import { AccountsContext } from "../context/accounts"
import { SettingsContext } from "../context/settings"
import * as routes from "../routes"

function AllAccountsPage(props: { history: History }) {
  const { accounts, networkSwitch, toggleNetwork } = useContext(AccountsContext)
  const settings = useContext(SettingsContext)
  const testnetAccounts = accounts.filter(account => account.testnet)

  const networkSwitchButton = (
    <Button color="inherit" variant="outlined" onClick={toggleNetwork} style={{ borderColor: "white" }}>
      {networkSwitch === "testnet" ? "Switch to Mainnet" : "Switch to Testnet"}
    </Button>
  )
  return (
    <Section top brandColored>
      <Box margin="16px 24px" style={{ position: "relative" }}>
        <Typography color="inherit" variant="headline" style={{ marginRight: 180, marginBottom: 12 }}>
          {networkSwitch === "testnet" ? "Testnet Accounts" : "My Accounts"}
        </Typography>
        <Box style={{ position: "absolute", top: 0, right: 0, zIndex: 2 }}>
          {settings.showTestnet || networkSwitch === "testnet" || testnetAccounts.length > 0
            ? networkSwitchButton
            : null}
          <IconButton
            onClick={() => props.history.push(routes.settings())}
            style={{ marginLeft: 8, marginRight: -10, color: "inherit" }}
          >
            <SettingsIcon />
          </IconButton>
        </Box>
        <Box margin="16px 0 0">
          <AccountList
            accounts={accounts}
            testnet={networkSwitch === "testnet"}
            onCreatePubnetAccount={() => props.history.push(routes.createAccount(false))}
            onCreateTestnetAccount={() => props.history.push(routes.createAccount(true))}
          />
        </Box>
      </Box>
    </Section>
  )
}

export default withRouter(AllAccountsPage)
