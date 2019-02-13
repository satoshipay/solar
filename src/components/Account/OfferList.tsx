import BigNumber from "big.js"
import React from "react"
import { useState } from "react"
import { OfferRecord, Operation, Server, Transaction } from "stellar-sdk"
import Button from "@material-ui/core/Button"
import ListItem from "@material-ui/core/ListItem"
import ListItemIcon from "@material-ui/core/ListItemIcon"
import ListItemText from "@material-ui/core/ListItemText"
import ListSubheader from "@material-ui/core/ListSubheader"
import ArrowRightIcon from "@material-ui/icons/ArrowRightAlt"
import BarChartIcon from "@material-ui/icons/BarChart"
import CloseIcon from "@material-ui/icons/Close"
import { Account } from "../../context/accounts"
import { trackError } from "../../context/notifications"
import { useAccountOffers, useHorizon } from "../../hooks"
import { createTransaction } from "../../lib/transaction"
import { HorizontalLayout } from "../Layout/Box"
import { List } from "../List"
import TransactionSender from "../TransactionSender"
import { SingleBalance } from "./AccountBalances"

function createDismissalTransaction(horizon: Server, account: Account, offer: OfferRecord): Promise<Transaction> {
  return createTransaction(
    [
      Operation.manageOffer({
        offerId: offer.id,
        amount: "0",
        buying: offer.buying,
        price: offer.price,
        selling: offer.selling
      })
    ],
    { horizon, walletAccount: account }
  )
}

interface OfferListItemProps {
  accountPublicKey: string
  offer: OfferRecord
  onCancel?: () => void
  style?: React.CSSProperties
}

function OfferListItem(props: OfferListItemProps) {
  const [hovering, setHoveringStatus] = useState(false)
  return (
    <ListItem
      onMouseEnter={() => setHoveringStatus(true)}
      onMouseLeave={() => setHoveringStatus(false)}
      style={props.style}
    >
      <ListItemIcon>
        <BarChartIcon />
      </ListItemIcon>
      <ListItemText
        primary={
          <span style={{ fontWeight: "bold" }}>
            Buy&nbsp;&nbsp;
            <SingleBalance
              assetCode={props.offer.buying.code}
              balance={String(BigNumber(props.offer.amount).mul(props.offer.price))}
              inline
            />
            &nbsp;&nbsp;for&nbsp;&nbsp;
            <SingleBalance assetCode={props.offer.selling.code} balance={props.offer.amount} inline />
          </span>
        }
      />
      {hovering ? (
        <Button onClick={props.onCancel} color="inherit" variant="contained">
          Cancel&nbsp;
          <CloseIcon style={{ fontSize: "140%" }} />
        </Button>
      ) : (
        <ListItemText primaryTypographyProps={{ align: "right" }} style={{ flexShrink: 0 }}>
          <HorizontalLayout alignItems="center" inline style={{ fontSize: "1.6rem" }}>
            <b>{props.offer.selling.code}</b>
            &nbsp;
            <ArrowRightIcon style={{ fontSize: "150%" }} />
            &nbsp;
            <b>{props.offer.buying.code}</b>
          </HorizontalLayout>
        </ListItemText>
      )}
    </ListItem>
  )
}

interface Props {
  account: Account
  title: React.ReactNode
}

function OfferList(props: Props & { sendTransaction: (tx: Transaction) => Promise<void> }) {
  const offers = useAccountOffers(props.account.publicKey, props.account.testnet)
  const horizon = useHorizon(props.account.testnet)

  console.log(">>")
  const onCancel = async (offer: OfferRecord) => {
    try {
      const tx = await createDismissalTransaction(horizon, props.account, offer)
      await props.sendTransaction(tx)
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
            style={{ background: "#ffffff", boxShadow: "#ccc 0px 1px 5px" }}
          />
        ))}
      </List>
    )
  }
}

function OfferListContainer(props: Props) {
  return (
    <TransactionSender account={props.account}>
      {({ sendTransaction }) => <OfferList {...props} sendTransaction={sendTransaction} />}
    </TransactionSender>
  )
}

export default OfferListContainer
