import React from "react"
import { History, Location } from "history"
import { observer } from "mobx-react"
import { withRouter } from "react-router-dom"
import Card from "@material-ui/core/Card"
import CardActionArea from "@material-ui/core/CardActionArea"
import CardContent from "@material-ui/core/CardContent"
import Typography from "@material-ui/core/Typography"
import AddIcon from "@material-ui/icons/Add"
import AccountBalances from "../components/Account/AccountBalances"
import * as routes from "../routes"
import AccountStore, { Account } from "../stores/accounts"
import { HorizontalLayout, VerticalLayout } from "./Layout/Box"

const StyledCard = (props: {
  children: React.ReactNode
  elevation?: number
  onClick: () => void
  style?: React.CSSProperties
}) => {
  return (
    <Card
      elevation={props.elevation}
      onClick={props.onClick}
      style={{ ...props.style, border: "2px solid white", borderRadius: 8 }}
    >
      <CardActionArea centerRipple style={{ width: "100%", height: "100%" }}>
        <CardContent style={{ boxSizing: "border-box", width: "100%", padding: "16px 24px", textOverflow: "ellipsis" }}>
          {props.children}
        </CardContent>
      </CardActionArea>
    </Card>
  )
}

const AccountCard = (props: { account: Account; history: History; style?: React.CSSProperties }) => {
  const onClick = () => props.history.push(routes.account(props.account.id))
  return (
    <StyledCard elevation={5} onClick={onClick} style={{ ...props.style, background: "white", color: "black" }}>
      <VerticalLayout height="100px" justifyContent="space-evenly" textAlign="left">
        <Typography variant="headline" style={{ marginBottom: 20 }}>
          {props.account.name}
        </Typography>
        <div style={{ fontSize: "120%" }}>
          <AccountBalances publicKey={props.account.publicKey} testnet={props.account.testnet} />
        </div>
      </VerticalLayout>
    </StyledCard>
  )
}

const AddAccountCard = (props: { onClick: () => any; style?: React.CSSProperties }) => {
  return (
    <StyledCard onClick={props.onClick} style={{ ...props.style, background: "transparent", color: "white" }}>
      <VerticalLayout height="100px" justifyContent="center" fontSize="1.3rem" textAlign="center">
        <div>
          <AddIcon style={{ fontSize: "200%" }} />
        </div>
        <div>Add new</div>
      </VerticalLayout>
    </StyledCard>
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
  const cardStyle = { width: "47%", maxWidth: 500, margin: "12px 1%" }

  return (
    <HorizontalLayout justifyContent="space-evenly" wrap="wrap">
      <AddAccountCard
        onClick={props.testnet ? props.onCreateTestnetAccount : props.onCreatePubnetAccount}
        style={cardStyle}
      />
      {accounts.map((account, index) => (
        <AccountCard key={account.id} account={account} history={props.history} style={cardStyle} />
      ))}
      {accounts.length % 2 ? null : <div style={cardStyle} />}
    </HorizontalLayout>
  )
}

export default withRouter<AccountListProps>(observer(AccountList))
