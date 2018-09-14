import React from "react"
import { History, Location } from "history"
import { observer } from "mobx-react"
import { withRouter } from "react-router-dom"
import AddIcon from "@material-ui/icons/AddCircle"
import ArrowCircleRightIcon from "react-icons/lib/fa/arrow-circle-right"
import AccountBalances from "../components/Account/AccountBalances"
import { List, ListItem } from "../components/List"
import * as routes from "../routes"
import AccountStore, { Account } from "../stores/accounts"

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
  accounts: typeof AccountStore
  history: History
  location: Location
  match: any
  staticContext: any
  testnet: boolean
  onCreatePubnetAccount: () => any
  onCreateTestnetAccount: () => any
}

const AccountList = (props: AccountListProps) => {
  const accounts = props.accounts.filter(account => account.testnet === props.testnet)

  return (
    <List>
      {accounts.map(account => (
        <AccountListItem key={account.id} account={account} history={props.history} />
      ))}
      <AddAccountItem
        label={props.testnet ? "Add testnet account…" : "Add account…"}
        onClick={props.testnet ? props.onCreateTestnetAccount : props.onCreatePubnetAccount}
      />
    </List>
  )
}

export default withRouter<AccountListProps>(observer(AccountList))
