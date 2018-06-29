import React from 'react'
import { observer } from 'mobx-react'
import { Section } from '../components/Layout/Page'
import { create as createAccountCreationDialog } from '../components/Overlay/CreateAccount'
import AccountList from '../components/AccountList'
import { openOverlay } from '../stores/overlays'
import WalletStore from '../stores/wallets'

const HomePage = (props: { wallets: typeof WalletStore }) => (
  <Section>
    <AccountList
      onCreatePubnetAccount={() => openOverlay(createAccountCreationDialog(false))}
      onCreateTestnetAccount={() => openOverlay(createAccountCreationDialog(true))}
      wallets={props.wallets}
    />
  </Section>
)

export default observer(HomePage)
