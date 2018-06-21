import React from 'react'
import { observer } from 'mobx-react'
import WalletList from '../components/WalletList'
import WalletStore from '../stores/wallets'

const HomePage = (props: { wallets: typeof WalletStore }) => (
  <div>
    <WalletList
      onCreatePubnetWallet={() => { /* FIXME */ }}
      onCreateTestnetWallet={() => { /* FIXME */ }}
      wallets={props.wallets}
    />
  </div>
)

export default observer(HomePage)
