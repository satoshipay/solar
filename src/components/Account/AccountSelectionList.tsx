import React from "react"
import { Account } from "../../context/accounts"
import List from "@material-ui/core/List"
import ListItem from "@material-ui/core/ListItem"
import ListItemText from "@material-ui/core/ListItemText"
import withStyles, { ClassNameMap } from "@material-ui/core/styles/withStyles"
import AccountBalances from "./AccountBalances"
import { transactionListItemStyles } from "./TransactionList"

interface AccountSelectionListProps {
  accounts: Account[]
  disabled?: boolean
  testnet: boolean
  onChange?: (account: Account) => void
}

function AccountSelectionList(props: AccountSelectionListProps) {
  const [selectedIndex, setSelectedIndex] = React.useState(-1)

  function handleListItemClick(event: React.MouseEvent, index: number) {
    setSelectedIndex(index)
    if (props.onChange) {
      props.onChange(props.accounts[index])
    }
  }

  return (
    <List style={{ background: "transparent", paddingLeft: 0, paddingRight: 0 }}>
      {props.accounts.map((account, index) => (
        <AccountSelectionListItem
          account={account}
          disabled={props.disabled}
          index={index}
          key={account.id}
          onClick={handleListItemClick}
          selected={index === selectedIndex}
        />
      ))}
    </List>
  )
}

interface AccountSelectionListItemProps {
  account: Account
  classes: ClassNameMap<keyof typeof transactionListItemStyles>
  disabled?: boolean
  index: number
  onClick: (event: React.MouseEvent, index: number) => void
  selected: boolean
  style?: React.CSSProperties
}

const AccountSelectionListItem = React.memo(
  // tslint:disable-next-line no-shadowed-variable
  withStyles(transactionListItemStyles)(function AccountSelectionListItem(props: AccountSelectionListItemProps) {
    return (
      <ListItem
        button
        className={props.classes.listItem}
        disabled={props.disabled}
        selected={props.selected}
        onClick={event => props.onClick(event, props.index)}
      >
        <ListItemText
          primary={props.account.name}
          secondary={<AccountBalances publicKey={props.account.publicKey} testnet={props.account.testnet} />}
        />
      </ListItem>
    )
  } as React.ComponentType<AccountSelectionListItemProps>)
)

export default AccountSelectionList
