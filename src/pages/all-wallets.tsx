import React from 'react'
import { observer } from 'mobx-react'
import WalletList from '../components/WalletList'
import { create as createWalletCreationDialog } from '../components/Overlay/CreateWallet'
import { openOverlay } from '../stores/overlays'
import WalletStore from '../stores/wallets'

const HomePage = (props: { wallets: typeof WalletStore }) => (
  <div>
    <WalletList
      onCreatePubnetWallet={() => openOverlay(createWalletCreationDialog(false))}
      onCreateTestnetWallet={() => openOverlay(createWalletCreationDialog(true))}
      wallets={props.wallets}
    />
  </div>
)

export default observer(HomePage)
