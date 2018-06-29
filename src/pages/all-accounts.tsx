import React from 'react'
import { observer } from 'mobx-react'
import { Section } from '../components/Layout/Page'
import { create as createAccountCreationDialog } from '../components/Overlay/CreateAccount'
import AccountList from '../components/AccountList'
import { openOverlay } from '../stores/overlays'
import AccountStore from '../stores/accounts'

const HomePage = (props: { accounts: typeof AccountStore }) => (
  <Section>
    <AccountList
      accounts={props.accounts}
      onCreatePubnetAccount={() => openOverlay(createAccountCreationDialog(false))}
      onCreateTestnetAccount={() => openOverlay(createAccountCreationDialog(true))}
    />
  </Section>
)

export default observer(HomePage)
