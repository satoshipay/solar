import { History } from "history"
import React from "react"
import { withRouter, RouteComponentProps } from "react-router"
import { observer } from "mobx-react"
import Button from "@material-ui/core/Button"
import Typography from "@material-ui/core/Typography"
import { Box } from "../components/Layout/Box"
import { Section } from "../components/Layout/Page"
import AccountList from "../components/AccountList"
import AccountStore, { toggleNetwork, NetworkSwitch } from "../stores/accounts"
import * as routes from "../routes"

interface Props {
  accounts: typeof AccountStore
  history: History
  networkSwitch: NetworkSwitch
}

const HomePage = (props: Props) => (
  <Section top backgroundColor="white">
    <Box padding="16px 24px" margin="0 0 -12px" style={{ position: "relative" }}>
      <Typography color="textSecondary" variant="headline" style={{ marginBottom: 12 }}>
        {props.networkSwitch.network === "testnet" ? "Testnet Accounts" : "Accounts"}
      </Typography>
      <Box style={{ position: "absolute", top: 15, right: 28, zIndex: 2 }}>
        <Button variant="outlined" onClick={toggleNetwork}>
          {props.networkSwitch.network === "testnet" ? "Switch to Mainnet" : "Switch to Testnet"}
        </Button>
      </Box>
    </Box>
    <AccountList
      accounts={props.accounts}
      testnet={props.networkSwitch.network === "testnet"}
      onCreatePubnetAccount={() => props.history.push(routes.createAccount(false))}
      onCreateTestnetAccount={() => props.history.push(routes.createAccount(true))}
    />
  </Section>
)

export default withRouter<RouteComponentProps<any> & Props>(observer(HomePage))
