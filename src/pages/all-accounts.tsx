import React from "react"
import { observer } from "mobx-react"
import { Section } from "../components/Layout/Page"
import { createAccountCreationDialog } from "../components/Dialog/index"
import AccountList from "../components/AccountList"
import AccountStore from "../stores/accounts"
import { openDialog } from "../stores/dialogs"

const HomePage = (props: { accounts: typeof AccountStore }) => (
  <Section top>
    <AccountList
      accounts={props.accounts}
      onCreatePubnetAccount={() => openDialog(createAccountCreationDialog(false))}
      onCreateTestnetAccount={() => openDialog(createAccountCreationDialog(true))}
    />
  </Section>
)

export default observer(HomePage)
