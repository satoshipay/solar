import BigNumber from "big.js"
import React from "react"
import { Operation, Server, Transaction } from "stellar-sdk"
import ListItem from "@material-ui/core/ListItem"
import ListItemIcon from "@material-ui/core/ListItemIcon"
import ListItemText from "@material-ui/core/ListItemText"
import ListSubheader from "@material-ui/core/ListSubheader"
import withStyles, { ClassNameMap } from "@material-ui/core/styles/withStyles"
import ArrowRightIcon from "@material-ui/icons/ArrowRightAlt"
import BarChartIcon from "@material-ui/icons/BarChart"
import { Account } from "../../context/accounts"
import { trackError } from "../../context/notifications"
import { useAccountData, useAccountOffers, useHorizon, useIsMobile, ObservedAccountData } from "../../hooks"
import { offerAssetToAsset } from "../../lib/stellar"
import { createTransaction } from "../../lib/transaction"
import { HorizontalLayout } from "../Layout/Box"
import { List } from "../List"
import TransactionSender from "../TransactionSender"
import { SingleBalance } from "./AccountBalances"
import { transactionListItemStyles } from "./TransactionList"

function createDismissalTransaction(
  horizon: Server,
  account: Account,
  accountData: ObservedAccountData,
  offer: Server.OfferRecord
): Promise<Transaction> {
  return createTransaction(
    [
      Operation.manageSellOffer({
        offerId: offer.id,
        amount: "0",
        buying: offerAssetToAsset(offer.buying),
        price: offer.price,
        selling: offerAssetToAsset(offer.selling)
      })
    ],
    { accountData, horizon, walletAccount: account }
  )
}

interface OfferListItemProps {
  accountPublicKey: string
  classes: ClassNameMap<keyof typeof transactionListItemStyles>
  offer: Server.OfferRecord
  onCancel?: () => void
  style?: React.CSSProperties
}

const OfferListItem = React.memo(
  // tslint:disable-next-line no-shadowed-variable
  withStyles(transactionListItemStyles)(function OfferListItem(props: OfferListItemProps) {
    const buying = offerAssetToAsset(props.offer.buying)
    const selling = offerAssetToAsset(props.offer.selling)
    const isSmallScreen = useIsMobile()
    return (
      <ListItem
        button={Boolean(props.onCancel) as any}
        className={props.classes.listItem}
        onClick={props.onCancel}
        style={{ minHeight: isSmallScreen ? 58 : 72, ...props.style }}
      >
        <ListItemIcon style={{ marginRight: isSmallScreen ? 0 : undefined }}>
          <BarChartIcon />
        </ListItemIcon>
        <ListItemText
          primary={
            <span style={{ fontWeight: "bold" }}>
              Sell&nbsp;&nbsp;
              <SingleBalance assetCode={selling.getCode()} balance={props.offer.amount} inline />
              &nbsp;&nbsp;for&nbsp;&nbsp;
              <SingleBalance
                assetCode={buying.getCode()}
                balance={String(BigNumber(props.offer.amount).mul(props.offer.price))}
                inline
              />
            </span>
          }
          primaryTypographyProps={{
            style: { overflow: "hidden", textOverflow: "ellipsis" }
          }}
          style={{ paddingRight: isSmallScreen ? 0 : undefined }}
        />
        <ListItemText
          primaryTypographyProps={{ align: "right" }}
          style={{ display: isSmallScreen ? "none" : undefined, flexShrink: 0, paddingRight: 0 }}
        >
          <HorizontalLayout alignItems="center" inline style={{ fontSize: "1.4rem" }}>
            <b>{selling.getCode()}</b>
            &nbsp;
            <ArrowRightIcon style={{ fontSize: "150%" }} />
            &nbsp;
            <b>{buying.getCode()}</b>
          </HorizontalLayout>
        </ListItemText>
      </ListItem>
    )
  } as React.ComponentType<OfferListItemProps>)
)

interface Props {
  account: Account
  title: React.ReactNode
}

function OfferList(props: Props & { sendTransaction: (account: Account, tx: Transaction) => Promise<void> }) {
  const accountData = useAccountData(props.account.publicKey, props.account.testnet)
  const offers = useAccountOffers(props.account.publicKey, props.account.testnet)
  const horizon = useHorizon(props.account.testnet)

  const onCancel = async (offer: Server.OfferRecord) => {
    try {
      const tx = await createDismissalTransaction(horizon, props.account, accountData, offer)
      await props.sendTransaction(props.account, tx)
    } catch (error) {
      trackError(error)
    }
  }

  if (offers.loading || offers.offers.length === 0) {
    return null
  } else {
    return (
      <List style={{ background: "transparent" }}>
        <ListSubheader disableSticky style={{ background: "transparent" }}>
          {props.title}
        </ListSubheader>
        {offers.offers.map(offer => (
          <OfferListItem
            key={offer.id}
            accountPublicKey={props.account.publicKey}
            offer={offer}
            onCancel={() => onCancel(offer)}
          />
        ))}
      </List>
    )
  }
}

function OfferListContainer(props: Props) {
  return (
    <TransactionSender testnet={props.account.testnet}>
      {({ sendTransaction }) => <OfferList {...props} sendTransaction={sendTransaction} />}
    </TransactionSender>
  )
}

export default OfferListContainer
