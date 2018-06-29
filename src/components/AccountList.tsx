import React from 'react'
import { History, Location } from 'history'
import Divider from '@material-ui/core/Divider'
import Typography from '@material-ui/core/Typography'
import ArrowCircleRightIcon from 'react-icons/lib/fa/arrow-circle-right'
import AddIcon from 'react-icons/lib/md/add'
import { observer } from 'mobx-react'
import { withRouter } from 'react-router-dom'
import { List, ListItem, ListSubheader } from '../components/List'
import { AccountBalance } from '../components/Balance'
import * as routes from '../lib/routes'
import WalletStore, { Wallet } from '../stores/wallets'

const AccountListHeader = (props: { children: React.ReactNode }) => {
  return (
    <ListSubheader style={{ paddingTop: 12, paddingBottom: 12 }}>
      <Typography color='inherit' variant='title'>{props.children}</Typography>
    </ListSubheader>
  )
}

const AccountListItem = (props: { account: Wallet, history: History }) => {
  const { account, history } = props
  return (
    <ListItem
      button
      primaryText={account.name}
      secondaryText={<small><AccountBalance publicKey={account.publicKey} testnet={account.testnet} /></small>}
      onClick={() => history.push(routes.account(account.id))}
      rightIcon={<ArrowCircleRightIcon style={{ width: 32, height: 32 }} />}
    />
  )
}

const AddAccountItem = (props: { label: React.ReactNode, onClick: () => any }) => {
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

interface AccountListProps {
  history: History,
  location: Location,
  match: any,
  staticContext: any,
  wallets: typeof WalletStore,
  onCreatePubnetAccount: () => any,
  onCreateTestnetAccount: () => any
}

const AccountList = ({ history, wallets, onCreatePubnetAccount, onCreateTestnetAccount }: AccountListProps) => {
  const pubnetAccounts = wallets.filter(wallet => !wallet.testnet)
  const testnetAccounts = wallets.filter(wallet => wallet.testnet)

  return (
    <List>
      <AccountListHeader>
        Accounts
      </AccountListHeader>
      {...pubnetAccounts.map(account => <AccountListItem key={account.id} account={account} history={history} />)}
      <AddAccountItem label='Add account…' onClick={onCreatePubnetAccount} />
      <Divider style={{ margin: '16px 0' }} />
      <AccountListHeader>
        Testnet Accounts
      </AccountListHeader>
      {...testnetAccounts.map(account => <AccountListItem key={account.id} account={account} history={history} />)}
      <AddAccountItem label='Add testnet account…' onClick={onCreateTestnetAccount} />
    </List>
  )
}

export default withRouter<AccountListProps>(observer(AccountList))
