import React from 'react'
import { History, Location } from 'history'
import Divider from '@material-ui/core/Divider'
import ArrowCircleRightIcon from 'react-icons/lib/fa/arrow-circle-right'
import { withRouter } from 'react-router-dom'
import { List, ListItem, ListSubheader } from '../components/List'
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
      button
      primaryText={wallet.name}
      secondaryText={<small><AccountBalance publicKey={wallet.publicKey} testnet={wallet.testnet} /></small>}
      onClick={() => history.push(`/wallet/${wallet.id}`)}
      rightIcon={<ArrowCircleRightIcon style={{ width: 32, height: 32 }} />}
    />
  )

  const renderedPubnetWallets = pubnetWallets.length === 0 ? null : [
    <ListSubheader>Wallets</ListSubheader>,
    ...pubnetWallets.map(WalletListItem)
  ]
  const renderedTestnetWallets = testnetWallets.length === 0 ? null : [
    <ListSubheader>Testnet Wallets</ListSubheader>,
    ...testnetWallets.map(WalletListItem)
  ]

  return (
    <List>
      {renderedPubnetWallets}
      {renderedPubnetWallets && renderedTestnetWallets ? <Divider /> : null}
      {renderedTestnetWallets}
    </List>
  )
}

export default withRouter<WalletListProps>(WalletList)
