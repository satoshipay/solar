import { History } from "history"
import React from "react"
import { withRouter } from "react-router"
import Button from "@material-ui/core/Button"
import Typography from "@material-ui/core/Typography"
import { Box } from "../components/Layout/Box"
import { Section } from "../components/Layout/Page"
import AccountList from "../components/AccountList"
import { Account, AccountsConsumer, AccountsContext, NetworkID } from "../context/accounts"
import * as routes from "../routes"

interface Props {
  accounts: Account[]
  history: History
  networkSwitch: NetworkID
  toggleNetwork: AccountsContext["toggleNetwork"]
}

const AllAccountsPage = (props: Props) => {
  return (
    <Section top brandColored>
      <Box margin="16px 24px" style={{ position: "relative" }}>
        <Typography color="inherit" variant="headline" style={{ marginRight: 180, marginBottom: 12 }}>
          {props.networkSwitch === "testnet" ? "Testnet Accounts" : "My Accounts"}
        </Typography>
        <Box style={{ position: "absolute", top: 0, right: 0, zIndex: 2 }}>
          <Button color="inherit" variant="outlined" onClick={props.toggleNetwork} style={{ borderColor: "white" }}>
            {props.networkSwitch === "testnet" ? "Switch to Mainnet" : "Switch to Testnet"}
          </Button>
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

const AllAccountsPageContainer = (props: Pick<Props, "history">) => {
  return (
    <AccountsConsumer>
      {({ accounts, networkSwitch, toggleNetwork }) => (
        <AllAccountsPage {...props} accounts={accounts} networkSwitch={networkSwitch} toggleNetwork={toggleNetwork} />
      )}
    </AccountsConsumer>
  )
}

export default withRouter(AllAccountsPageContainer)
