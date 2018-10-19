import React from "react"
import { History, Location } from "history"
import { withRouter } from "react-router-dom"
import Card from "@material-ui/core/Card"
import CardActionArea from "@material-ui/core/CardActionArea"
import CardContent from "@material-ui/core/CardContent"
import Typography from "@material-ui/core/Typography"
import withStyles, { ClassNameMap, StyleRules } from "@material-ui/core/styles/withStyles"
import AddIcon from "@material-ui/icons/Add"
import AccountBalances from "../components/Account/AccountBalances"
import { Account } from "../context/accounts"
import * as routes from "../routes"
import { HorizontalLayout, VerticalLayout } from "./Layout/Box"

const cardStyles: StyleRules = {
  card: {
    width: "47%",
    minWidth: 250,
    maxWidth: 500,
    flexGrow: 1,
    margin: "12px 1%",
    borderRadius: 8
  },
  cardActionArea: {
    width: "100%",
    height: "100%"
  },
  content: {
    boxSizing: "border-box",
    width: "100%",
    padding: "16px 24px",
    textOverflow: "ellipsis"
  }
}

const StyledCard = withStyles(cardStyles)(
  (props: {
    children?: React.ReactNode
    classes: ClassNameMap<keyof typeof cardStyles>
    elevation?: number
    onClick?: () => void
    style?: React.CSSProperties
  }) => {
    return (
      <Card className={props.classes.card} elevation={props.elevation} onClick={props.onClick} style={props.style}>
        <CardActionArea className={props.classes.cardActionArea} centerRipple>
          <CardContent className={props.classes.content}>{props.children}</CardContent>
        </CardActionArea>
      </Card>
    )
  }
)

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
    <StyledCard
      onClick={props.onClick}
      style={{ ...props.style, background: "transparent", border: "2px solid white", color: "white" }}
    >
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
  accounts: Account[]
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
    <HorizontalLayout justifyContent="space-evenly" wrap="wrap" margin="0 -1%" width="102%">
      <AddAccountCard onClick={props.testnet ? props.onCreateTestnetAccount : props.onCreatePubnetAccount} />
      {accounts.map((account, index) => (
        <AccountCard key={account.id} account={account} history={props.history} />
      ))}
      {accounts.length % 2 ? null : <StyledCard style={{ visibility: "hidden" }} />}
    </HorizontalLayout>
  )
}

export default withRouter<AccountListProps>(AccountList)
