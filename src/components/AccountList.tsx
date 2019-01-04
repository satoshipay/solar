import React from "react"
import { useContext } from "react"
import { History, Location } from "history"
import { withRouter } from "react-router-dom"
import Badge, { BadgeProps } from "@material-ui/core/Badge"
import CardActionArea from "@material-ui/core/CardActionArea"
import CardContent from "@material-ui/core/CardContent"
import Tooltip from "@material-ui/core/Tooltip"
import Typography from "@material-ui/core/Typography"
import withStyles, { ClassNameMap, StyleRules } from "@material-ui/core/styles/withStyles"
import AddIcon from "@material-ui/icons/Add"
import GroupIcon from "@material-ui/icons/Group"
import AccountBalances from "../components/Account/AccountBalances"
import { CardList, CardListCard } from "../components/CardList"
import { Account } from "../context/accounts"
import { SignatureDelegationContext } from "../context/signatureDelegation"
import { useAccountData } from "../hooks"
import { SignatureRequest } from "../lib/multisig-service"
import { hasSigned } from "../lib/transaction"
import * as routes from "../routes"
import { Box, HorizontalLayout, VerticalLayout } from "./Layout/Box"

const cardStyles: StyleRules = {
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
      <CardListCard elevation={props.elevation} onClick={props.onClick} style={props.style}>
        <CardActionArea className={props.classes.cardActionArea} centerRipple>
          <CardContent className={props.classes.content}>{props.children}</CardContent>
        </CardActionArea>
      </CardListCard>
    )
  }
)

const badgeStyles: StyleRules = {
  badge: {
    marginTop: 4,
    marginRight: -2
  }
}

const StyledBadge = withStyles(badgeStyles)((props: BadgeProps) => {
  return props.badgeContent ? (
    <Badge {...props} />
  ) : (
    <div className={props.className} style={props.style}>
      {props.children}
    </div>
  )
})

function AccountCard(props: {
  account: Account
  history: History
  pendingSignatureRequests: SignatureRequest[]
  style?: React.CSSProperties
}) {
  const accountData = useAccountData(props.account.publicKey, props.account.testnet)

  const onClick = () => props.history.push(routes.account(props.account.id))
  const pendingSignatureRequests = props.pendingSignatureRequests.filter(
    req =>
      req._embedded.signers.some(signer => signer.account_id === props.account.publicKey) &&
      !hasSigned(req.meta.transaction, props.account.publicKey)
  )
  const badgeContent = pendingSignatureRequests.length > 0 ? pendingSignatureRequests.length : null
  return (
    <StyledCard elevation={5} onClick={onClick} style={{ background: "white", color: "black" }}>
      <StyledBadge badgeContent={badgeContent} color="secondary" style={{ width: "100%" }}>
        <VerticalLayout height="100px" justifyContent="space-evenly" textAlign="left">
          <HorizontalLayout margin="0 0 20px">
            <Typography variant="headline" style={{ flexGrow: 1 }}>
              {props.account.name}
            </Typography>
            <Box>
              {accountData.signers.length > 1 ? (
                <Tooltip title="Multi-Signature Account">
                  <GroupIcon style={{ marginTop: 6 }} />
                </Tooltip>
              ) : null}
            </Box>
          </HorizontalLayout>
          <Box fontSize="120%">
            <AccountBalances publicKey={props.account.publicKey} testnet={props.account.testnet} />
          </Box>
        </VerticalLayout>
      </StyledBadge>
    </StyledCard>
  )
}

function AddAccountCard(props: { onClick: () => any; style?: React.CSSProperties }) {
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

function AccountList(props: AccountListProps) {
  const accounts = props.accounts.filter(account => account.testnet === props.testnet)
  const { pendingSignatureRequests } = useContext(SignatureDelegationContext)

  return (
    <CardList addInvisibleCard={accounts.length % 2 === 0}>
      <AddAccountCard onClick={props.testnet ? props.onCreateTestnetAccount : props.onCreatePubnetAccount} />
      {accounts.map((account, index) => (
        <AccountCard
          key={account.id}
          account={account}
          history={props.history}
          pendingSignatureRequests={pendingSignatureRequests}
        />
      ))}
    </CardList>
  )
}

export default withRouter<AccountListProps>(AccountList)
