import React from "react"
import Badge, { BadgeProps } from "@material-ui/core/Badge"
import CardActionArea from "@material-ui/core/CardActionArea"
import CardContent from "@material-ui/core/CardContent"
import makeStyles from "@material-ui/core/styles/makeStyles"
import Tooltip from "@material-ui/core/Tooltip"
import Typography from "@material-ui/core/Typography"
import AddIcon from "@material-ui/icons/Add"
import GroupIcon from "@material-ui/icons/Group"
import AccountBalances from "~Account/components/AccountBalances"
import { CardList, CardListCard } from "~Layout/components/CardList"
import { Account } from "../contexts/accounts"
import { SignatureDelegationContext } from "../contexts/signatureDelegation"
import { useLiveAccountData } from "~Generic/hooks/stellar-subscriptions"
import { useRouter } from "~Generic/hooks/userinterface"
import { containsStellarGuardAsSigner } from "~Generic/lib/stellar-guard"
import { SignatureRequest } from "~Generic/lib/multisig-service"
import InlineLoader from "~Generic/components/InlineLoader"
import StellarGuardIcon from "~Icons/components/StellarGuard"
import { Box, HorizontalLayout, VerticalLayout } from "~Layout/components/Box"
import * as routes from "../routes"

const useCardStyles = makeStyles({
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
})

const StyledCard = (props: {
  children?: React.ReactNode
  elevation?: number
  onClick?: () => void
  style?: React.CSSProperties
}) => {
  const classes = useCardStyles()
  return (
    <CardListCard elevation={props.elevation} onClick={props.onClick} style={props.style}>
      <CardActionArea className={classes.cardActionArea} centerRipple>
        <CardContent className={classes.content}>{props.children}</CardContent>
      </CardActionArea>
    </CardListCard>
  )
}

const useBadgeStyles = makeStyles({
  badge: {
    marginTop: 4,
    marginRight: -2
  }
})

const StyledBadge = (props: BadgeProps) => {
  const classes = useBadgeStyles()
  return props.badgeContent ? (
    <Badge {...props} />
  ) : (
    <div className={classes.badge} style={props.style}>
      {props.children}
    </div>
  )
}

function Badges(props: { account: Account }) {
  const accountData = useLiveAccountData(props.account.publicKey, props.account.testnet)
  const multiSigIcon = containsStellarGuardAsSigner(accountData.signers) ? (
    <Tooltip title="StellarGuard Protection">
      <StellarGuardIcon style={{ marginTop: 6 }} />
    </Tooltip>
  ) : (
    <Tooltip title="Multi-Signature Account">
      <GroupIcon style={{ marginTop: 6 }} />
    </Tooltip>
  )
  return <Box>{accountData.signers.length > 1 ? multiSigIcon : null}</Box>
}

interface AccountCardProps {
  account: Account
  pendingSignatureRequests: SignatureRequest[]
  style?: React.CSSProperties
}

function AccountCard(props: AccountCardProps) {
  const router = useRouter()

  const onClick = () => router.history.push(routes.account(props.account.id))
  const pendingSignatureRequests = props.pendingSignatureRequests.filter(
    req =>
      req._embedded.signers.some(signer => signer.account_id === props.account.publicKey) &&
      !req._embedded.signers.find(signer => signer.account_id === props.account.publicKey)!.has_signed
  )
  const badgeContent = pendingSignatureRequests.length > 0 ? pendingSignatureRequests.length : null

  return (
    <StyledCard elevation={5} onClick={onClick} style={{ background: "white", color: "black" }}>
      <StyledBadge badgeContent={badgeContent} color="secondary" style={{ width: "100%" }}>
        <VerticalLayout minHeight="100px" justifyContent="space-evenly" textAlign="left">
          <HorizontalLayout margin="0 0 12px">
            <Typography variant="h5" style={{ flexGrow: 1, fontSize: 20 }}>
              {props.account.name}
            </Typography>
            <React.Suspense fallback={null}>
              <Badges account={props.account} />
            </React.Suspense>
          </HorizontalLayout>
          <Box fontSize="120%">
            <React.Suspense fallback={<InlineLoader />}>
              <AccountBalances publicKey={props.account.publicKey} testnet={props.account.testnet} />
            </React.Suspense>
          </Box>
        </VerticalLayout>
      </StyledBadge>
    </StyledCard>
  )
}

function AddAccountCard(props: { onClick: () => any; style?: React.CSSProperties }) {
  const style = {
    ...props.style,
    background: "transparent",
    border: "2px solid white",
    boxShadow: "none",
    color: "white"
  }
  return (
    <StyledCard onClick={props.onClick} style={style}>
      <VerticalLayout height="100px" justifyContent="center" fontSize="1.3rem" textAlign="center">
        <div>
          <AddIcon style={{ fontSize: "200%" }} />
        </div>
        <div>Add account</div>
      </VerticalLayout>
    </StyledCard>
  )
}

interface AccountListProps {
  accounts: Account[]
  testnet: boolean
  onCreatePubnetAccount: () => any
  onCreateTestnetAccount: () => any
}

function AccountList(props: AccountListProps) {
  const accounts = props.accounts.filter(account => account.testnet === props.testnet)
  const { pendingSignatureRequests } = React.useContext(SignatureDelegationContext)

  return (
    <CardList addInvisibleCard={accounts.length % 2 === 0}>
      <AddAccountCard onClick={props.testnet ? props.onCreateTestnetAccount : props.onCreatePubnetAccount} />
      {accounts.map(account => (
        <AccountCard key={account.id} account={account} pendingSignatureRequests={pendingSignatureRequests} />
      ))}
    </CardList>
  )
}

export default React.memo(AccountList)
