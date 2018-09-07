import React from "react"
import { History, Location } from "history"
import { observer } from "mobx-react"
import { withRouter } from "react-router-dom"
import Divider from "@material-ui/core/Divider"
import Typography from "@material-ui/core/Typography"
import AddIcon from "@material-ui/icons/AddCircle"
import ArrowCircleRightIcon from "react-icons/lib/fa/arrow-circle-right"
import AccountBalances from "../components/Account/AccountBalances"
import { List, ListItem, ListSubheader } from "../components/List"
import * as routes from "../routes"
import AccountStore, { Account } from "../stores/accounts"

const AccountListHeader = (props: { children: React.ReactNode }) => {
  return (
    <ListSubheader style={{ paddingTop: 12, paddingBottom: 12 }}>
      <Typography color="inherit" variant="title">
        {props.children}
      </Typography>
    </ListSubheader>
  )
}

const AccountListItem = (props: { account: Account; history: History }) => {
  const { account, history } = props
  return (
    <ListItem
      button
      primaryText={account.name}
      secondaryText={
        <small>
          <AccountBalances publicKey={account.publicKey} testnet={account.testnet} />
        </small>
      }
      onClick={() => history.push(routes.account(account.id))}
      rightIcon={<ArrowCircleRightIcon style={{ width: 32, height: 32 }} />}
    />
  )
}

const AddAccountItem = (props: { label: React.ReactNode; onClick: () => any }) => {
  return (
    <ListItem
      button
      primaryText={<span style={{ opacity: 0.87 }}>{props.label}</span>}
      onClick={props.onClick}
      leftIcon={<AddIcon style={{ marginTop: -2, opacity: 0.87 }} />}
      style={{ minHeight: 60 }}
    />
  )
}

interface AccountListProps {
  history: History
  location: Location
  match: any
  staticContext: any
  accounts: typeof AccountStore
  onCreatePubnetAccount: () => any
  onCreateTestnetAccount: () => any
}

const AccountList = ({ accounts, history, onCreatePubnetAccount, onCreateTestnetAccount }: AccountListProps) => {
  const pubnetAccounts = accounts.filter(account => !account.testnet)
  const testnetAccounts = accounts.filter(account => account.testnet)

  return (
    <List>
      <AccountListHeader>Accounts</AccountListHeader>
      {pubnetAccounts.map(account => (
        <AccountListItem key={account.id} account={account} history={history} />
      ))}
      <AddAccountItem label="Add account…" onClick={onCreatePubnetAccount} />
      {testnetAccounts.length > 0 ? (
        <>
          <Divider component="li" style={{ margin: "16px 0" }} />
          <AccountListHeader>Testnet Accounts</AccountListHeader>
          {testnetAccounts.map(account => (
            <AccountListItem key={account.id} account={account} history={history} />
          ))}
        </>
      ) : null}
      <AddAccountItem label="Add testnet account…" onClick={onCreateTestnetAccount} />
    </List>
  )
}

export default withRouter<AccountListProps>(observer(AccountList))
