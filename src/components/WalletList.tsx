import React from 'react'
import { History, Location } from 'history'
import Divider from 'material-ui/Divider'
import { List, ListItem } from '../components/List'
import Subheader from 'material-ui/Subheader'
import ArrowCircleRightIcon from 'react-icons/lib/fa/arrow-circle-right'
import { withRouter } from 'react-router-dom'
import { AccountBalance } from '../components/LumenBalance'
import WalletStore, { Wallet } from '../stores/wallets'

interface WalletListProps {
  history: History,
  location: Location,
  match: any,
  staticContext: any,
  wallets: typeof WalletStore
}

const WalletList = ({ history, wallets }: WalletListProps) => {
  const pubnetWallets = wallets.filter(wallet => !wallet.testnet)
  const testnetWallets = wallets.filter(wallet => wallet.testnet)

  const WalletListItem = (wallet: Wallet) => (
    <ListItem
      key={wallet.id}
      primaryText={wallet.name}
      secondaryText={<small><AccountBalance publicKey={wallet.publicKey} testnet={wallet.testnet} /></small>}
      onClick={() => history.push(`/wallet/${wallet.id}`)}
      rightIcon={<ArrowCircleRightIcon style={{ width: 32, height: 32 }} />}
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

export default withRouter<WalletListProps>(WalletList)
