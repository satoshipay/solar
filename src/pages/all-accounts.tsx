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
import { Account, AccountsConsumer, AccountsContextType, NetworkID } from "../context/accounts"
import { SettingsContext } from "../context/settings"
import * as routes from "../routes"

interface Props {
  accounts: Account[]
  history: History
  networkSwitch: NetworkID
  toggleNetwork: AccountsContextType["toggleNetwork"]
}

function AllAccountsPage(props: Props) {
  const settings = useContext(SettingsContext)
  const testnetAccounts = props.accounts.filter(account => account.testnet)

  const networkSwitch = (
    <Button color="inherit" variant="outlined" onClick={props.toggleNetwork} style={{ borderColor: "white" }}>
      {props.networkSwitch === "testnet" ? "Switch to Mainnet" : "Switch to Testnet"}
    </Button>
  )
  return (
    <Section top brandColored>
      <Box margin="16px 24px" style={{ position: "relative" }}>
        <Typography color="inherit" variant="headline" style={{ marginRight: 180, marginBottom: 12 }}>
          {props.networkSwitch === "testnet" ? "Testnet Accounts" : "My Accounts"}
        </Typography>
        <Box style={{ position: "absolute", top: 0, right: 0, zIndex: 2 }}>
          {settings.showTestnet || props.networkSwitch === "testnet" || testnetAccounts.length > 0
            ? networkSwitch
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
            accounts={props.accounts}
            testnet={props.networkSwitch === "testnet"}
            onCreatePubnetAccount={() => props.history.push(routes.createAccount(false))}
            onCreateTestnetAccount={() => props.history.push(routes.createAccount(true))}
          />
        </Box>
      </Box>
    </Section>
  )
}

function AllAccountsPageContainer(props: Pick<Props, "history">) {
  return <AccountsConsumer>{accountsContext => <AllAccountsPage {...props} {...accountsContext} />}</AccountsConsumer>
}

export default withRouter(AllAccountsPageContainer)
