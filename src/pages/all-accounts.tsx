import React from "react"
import { observer } from "mobx-react"
import Button from "@material-ui/core/Button"
import { Box } from "../components/Layout/Box"
import { Section } from "../components/Layout/Page"
import { createAccountCreationDialog } from "../components/Dialog/index"
import AccountList from "../components/AccountList"
import AccountStore, { toggleNetwork } from "../stores/accounts"
import { openDialog } from "../stores/dialogs"

interface Props {
  accounts: typeof AccountStore
  networkSwitch: { network: "mainnet" | "testnet" }
}

const HomePage = (props: Props) => (
  <Section top backgroundColor="white">
    <Box style={{ position: "absolute", top: 34, right: 20, zIndex: 2 }}>
      <Button variant="outlined" onClick={toggleNetwork}>
        {props.networkSwitch.network === "testnet" ? "Switch to Mainnet" : "Switch to Testnet"}
      </Button>
    </Box>
    <AccountList
      accounts={props.accounts}
      testnet={props.networkSwitch.network === "testnet"}
      onCreatePubnetAccount={() => openDialog(createAccountCreationDialog(false))}
      onCreateTestnetAccount={() => openDialog(createAccountCreationDialog(true))}
    />
  </Section>
)

export default observer(HomePage)
