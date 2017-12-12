import React from 'react'
import Divider from 'material-ui/Divider'
import { List, ListItem } from 'material-ui/List'
import Subheader from 'material-ui/Subheader'
import { withRouter } from 'react-router-dom'
import { AccountBalance } from '../components/LumenBalance'
import { derivePublicKey } from '../lib/key'

const WalletList = ({ history, wallets }) => {
  const pubnetWallets = wallets.filter(wallet => !wallet.testnet)
  const testnetWallets = wallets.filter(wallet => wallet.testnet)

  const WalletListItem = wallet => (
    <ListItem
      key={wallet.id}
      primaryText={wallet.name}
      secondaryText={<small><AccountBalance publicKey={derivePublicKey(wallet.privateKey)} testnet={wallet.testnet} /></small>}
      onClick={() => history.push(`/wallet/${wallet.id}`)}
    />
  )

  const renderedPubnetWallets = pubnetWallets.length === 0 ? null : (
    <div>
      <Subheader>Wallets</Subheader>
      {pubnetWallets.map(WalletListItem)}
    </div>
  )
  const renderedTestnetWallets = testnetWallets.length === 0 ? null : (
    <div>
      <Subheader>Testnet Wallets</Subheader>
      {testnetWallets.map(WalletListItem)}
    </div>
  )

  return (
    <List>
      {renderedPubnetWallets}
      {renderedPubnetWallets && renderedTestnetWallets ? <Divider /> : null}
      {renderedTestnetWallets}
    </List>
  )
}

export default withRouter(WalletList)
