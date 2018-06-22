import React from 'react'
import { History, Location } from 'history'
import Divider from '@material-ui/core/Divider'
import Typography from '@material-ui/core/Typography'
import ArrowCircleRightIcon from 'react-icons/lib/fa/arrow-circle-right'
import AddIcon from 'react-icons/lib/md/add'
import { observer } from 'mobx-react'
import { withRouter } from 'react-router-dom'
import { List, ListItem, ListSubheader } from '../components/List'
import { AccountBalance } from '../components/LumenBalance'
import WalletStore, { Wallet } from '../stores/wallets'

const WalletListHeader = (props: { children: React.ReactNode }) => {
  return (
    <ListSubheader style={{ paddingTop: 12, paddingBottom: 12 }}>
      <Typography color='inherit' variant='title'>{props.children}</Typography>
    </ListSubheader>
  )
}

const WalletListItem = (props: { history: History, wallet: Wallet }) => {
  const { history, wallet } = props
  return (
    <ListItem
      button
      primaryText={wallet.name}
      secondaryText={<small><AccountBalance publicKey={wallet.publicKey} testnet={wallet.testnet} /></small>}
      onClick={() => history.push(`/wallet/${wallet.id}`)}
      rightIcon={<ArrowCircleRightIcon style={{ width: 32, height: 32 }} />}
    />
  )
}

const AddWalletItem = (props: { label: React.ReactNode, onClick: () => any }) => {
  return (
    <ListItem
      button
      primaryText={<span style={{ opacity: 0.87 }}>{props.label}</span>}
      onClick={props.onClick}
      leftIcon={<AddIcon style={{ marginTop: -4, opacity: 0.87 }} />}
      style={{ minHeight: 60 }}
    />
  )
}

interface WalletListProps {
  history: History,
  location: Location,
  match: any,
  staticContext: any,
  wallets: typeof WalletStore,
  onCreatePubnetWallet: () => any,
  onCreateTestnetWallet: () => any
}

const WalletList = ({ history, wallets, onCreatePubnetWallet, onCreateTestnetWallet }: WalletListProps) => {
  const pubnetWallets = wallets.filter(wallet => !wallet.testnet)
  const testnetWallets = wallets.filter(wallet => wallet.testnet)

  return (
    <List>
      <WalletListHeader>
        Wallets
      </WalletListHeader>
      {...pubnetWallets.map(wallet => <WalletListItem key={wallet.id} history={history} wallet={wallet} />)}
      <AddWalletItem label='Add wallet…' onClick={onCreatePubnetWallet} />
      <Divider style={{ margin: '16px 0' }} />
      <WalletListHeader>
        Testnet Wallets
      </WalletListHeader>
      {...testnetWallets.map(wallet => <WalletListItem key={wallet.id} history={history} wallet={wallet} />)}
      <AddWalletItem label='Add testnet wallet…' onClick={onCreateTestnetWallet} />
    </List>
  )
}

export default withRouter<WalletListProps>(observer(WalletList))
