import BigNumber from "big.js"
import React from "react"
import { Asset, Memo, Operation, Transaction } from "stellar-sdk"
import HumanTime from "react-human-time"
import Collapse from "@material-ui/core/Collapse"
import List from "@material-ui/core/List"
import ListItem from "@material-ui/core/ListItem"
import ListItemIcon from "@material-ui/core/ListItemIcon"
import ListItemText from "@material-ui/core/ListItemText"
import ListSubheader from "@material-ui/core/ListSubheader"
import Tooltip from "@material-ui/core/Tooltip"
import CallMadeIcon from "@material-ui/icons/CallMade"
import CallReceivedIcon from "@material-ui/icons/CallReceived"
import SettingsIcon from "@material-ui/icons/Settings"
import SwapHorizIcon from "@material-ui/icons/SwapHoriz"
import { Account } from "../../context/accounts"
import { useIsMobile } from "../../hooks"
import { getPaymentSummary, PaymentSummary } from "../../lib/paymentSummary"
import { createCheapTxID } from "../../lib/transaction"
import { PublicKey } from "../PublicKey"
import TransactionViewer from "../TransactionViewer"
import { formatOperation } from "../TransactionSummary/Operations"
import { formatBalance, SingleBalance } from "./AccountBalances"

type TransactionWithUndocumentedProps = Transaction & {
  created_at: string
}

const dedupe = <T extends any>(array: T[]): T[] => Array.from(new Set(array))

function EntryAnimation(props: { children: React.ReactNode; animate: boolean }) {
  return props.animate ? (
    <Collapse appear enter={false} in timeout={{ enter: 1000 }}>
      {props.children}
    </Collapse>
  ) : (
    <React.Fragment>{props.children}</React.Fragment>
  )
}

function MemoMessage(props: { memo: Memo }) {
  const memo = props.memo
  if (!memo.value) {
    return null
  } else if (Buffer.isBuffer(memo.value)) {
    const text = memo.type === "text" ? memo.value.toString("utf8") : memo.value.toString("hex")
    return (
      <>
        Memo:&nbsp;
        {text}
      </>
    )
  } else {
    return (
      <>
        Memo:&nbsp;
        {memo.value}
      </>
    )
  }
}

function OfferDescription(props: {
  amount: BigNumber
  buying: Asset
  offerId: string
  price: BigNumber
  selling: Asset
}) {
  const { amount, buying, offerId, price, selling } = props
  let prefix: string

  if (amount.eq(0)) {
    return (
      <>
        Delete offer: Sell {selling.code} for {buying.code}
      </>
    )
  }

  if (offerId === "0") {
    // Offer creation
    prefix = ""
  } else if (amount.eq(0)) {
    prefix = "Delete offer: "
  } else {
    prefix = "Update offer: "
  }

  return (
    <>
      {prefix}
      Sell {formatBalance(amount.toString())} {selling.code} for {formatBalance(amount.mul(price).toString())}{" "}
      {buying.code}
    </>
  )
}

function RemotePublicKeys(props: { publicKeys: string[]; short?: boolean }) {
  if (props.publicKeys.length === 0) {
    return <>-</>
  } else if (props.publicKeys.length === 1) {
    return <PublicKey publicKey={props.publicKeys[0]} variant={props.short ? "short" : "full"} />
  } else {
    return (
      <>
        <PublicKey publicKey={props.publicKeys[0]} variant="short" /> <i>+ {props.publicKeys.length - 1} more</i>
      </>
    )
  }
}

function Time(props: { time: string }) {
  const { localeString, unixTime } = React.useMemo(
    () => {
      // Turns out that this takes more time than expected
      const date = new Date(props.time)
      return {
        localeString: date.toLocaleString(),
        unixTime: date.getTime()
      }
    },
    [props.time]
  )
  return (
    <Tooltip title={<span style={{ fontSize: "110%" }}>{localeString}</span>}>
      <span style={{ whiteSpace: "nowrap" }}>
        <HumanTime time={unixTime} />
      </span>
    </Tooltip>
  )
}

function TransactionIcon(props: { paymentSummary: PaymentSummary; transaction: Transaction }) {
  if (props.transaction.operations.length === 1 && props.transaction.operations[0].type === "manageSellOffer") {
    return <SwapHorizIcon />
  } else if (props.paymentSummary.length === 0) {
    return <SettingsIcon />
  } else if (props.paymentSummary.every(summaryItem => summaryItem.balanceChange.gt(0))) {
    return <CallReceivedIcon />
  } else if (props.paymentSummary.every(summaryItem => summaryItem.balanceChange.lt(0))) {
    return <CallMadeIcon />
  } else {
    return <SwapHorizIcon />
  }
}

interface TitleTextProps {
  accountPublicKey: string
  alwaysShowSource?: boolean
  createdAt: string
  paymentSummary: PaymentSummary
  style?: React.CSSProperties
  transaction: Transaction
}

// TODO: Re-use code of transaction summary operation heading
function TransactionItemText(props: TitleTextProps) {
  const isSmallScreen = useIsMobile()

  const remotePublicKeys = props.paymentSummary.reduce(
    (pubKeys, summaryItem) => pubKeys.concat(summaryItem.publicKeys),
    [] as string[]
  )

  const secondary = (
    <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis" }}>
      <Time time={props.createdAt} />
      {props.transaction.memo.type !== "none" ? (
        <>
          &nbsp;&nbsp;|&nbsp;&nbsp;
          <MemoMessage memo={props.transaction.memo} />
        </>
      ) : null}
    </span>
  )

  if (remotePublicKeys.length > 0 && props.paymentSummary.every(summaryItem => summaryItem.balanceChange.gt(0))) {
    return (
      <ListItemText
        primary={
          <span>
            From&nbsp;
            <RemotePublicKeys publicKeys={remotePublicKeys} short={isSmallScreen} />
          </span>
        }
        primaryTypographyProps={{ style: props.style }}
        secondary={secondary}
        style={props.style}
      />
    )
  } else if (
    remotePublicKeys.length > 0 &&
    props.paymentSummary.every(summaryItem => summaryItem.balanceChange.lt(0))
  ) {
    return (
      <ListItemText
        primary={
          <span>
            To&nbsp;
            <RemotePublicKeys publicKeys={remotePublicKeys} short={props.alwaysShowSource || isSmallScreen} />
            {props.alwaysShowSource ? (
              <span>
                &nbsp;from&nbsp;
                <PublicKey publicKey={props.accountPublicKey} variant="short" />{" "}
              </span>
            ) : null}
          </span>
        }
        primaryTypographyProps={{ style: props.style }}
        secondary={secondary}
        style={props.style}
      />
    )
  } else if (props.transaction.operations.length === 1 && props.transaction.operations[0].type === "changeTrust") {
    const operation = props.transaction.operations[0] as Operation.ChangeTrust

    return BigNumber(operation.limit).eq(0) ? (
      <ListItemText
        primary={
          <span>
            Remove trust in asset {operation.line.code}
            {props.alwaysShowSource ? (
              <>
                {" "}
                (<PublicKey publicKey={props.accountPublicKey} variant="short" />)
              </>
            ) : null}
          </span>
        }
        primaryTypographyProps={{ style: props.style }}
        secondary={secondary}
        style={props.style}
      />
    ) : (
      <ListItemText
        primary={
          <span>
            Trust asset {operation.line.code}
            {props.alwaysShowSource ? (
              <>
                {" "}
                (<PublicKey publicKey={props.accountPublicKey} variant="short" />)
              </>
            ) : null}
          </span>
        }
        primaryTypographyProps={{ style: props.style }}
        secondary={secondary}
        style={props.style}
      />
    )
  } else if (props.transaction.operations.length === 1 && props.transaction.operations[0].type === "manageSellOffer") {
    const operation = props.transaction.operations[0] as Operation.ManageSellOffer

    if (String(operation.offerId) === "0") {
      // Create offer
      return (
        <ListItemText
          primary={
            <span>
              <OfferDescription
                {...operation}
                amount={BigNumber(operation.amount)}
                price={BigNumber(operation.price)}
              />
              {props.alwaysShowSource ? (
                <>
                  {" "}
                  (<PublicKey publicKey={props.accountPublicKey} variant="short" />)
                </>
              ) : null}
            </span>
          }
          primaryTypographyProps={{ style: props.style }}
          secondary={secondary}
          style={props.style}
        />
      )
    } else if (BigNumber(operation.amount).eq(0)) {
      // Delete offer
      return (
        <ListItemText
          primary={
            <span>
              <OfferDescription {...operation} amount={BigNumber(0)} price={BigNumber(operation.price)} />
              {props.alwaysShowSource ? (
                <>
                  {" "}
                  (<PublicKey publicKey={props.accountPublicKey} variant="short" />)
                </>
              ) : null}
            </span>
          }
          primaryTypographyProps={{ style: props.style }}
          secondary={secondary}
          style={props.style}
        />
      )
    } else {
      // Update offer
      return (
        <ListItemText
          primary={
            <span>
              <OfferDescription
                {...operation}
                amount={BigNumber(operation.amount)}
                price={BigNumber(operation.price)}
              />
              {props.alwaysShowSource ? (
                <>
                  {" "}
                  (<PublicKey publicKey={props.accountPublicKey} variant="short" />)
                </>
              ) : null}
            </span>
          }
          primaryTypographyProps={{ style: props.style }}
          secondary={secondary}
          style={props.style}
        />
      )
    }
  } else {
    const formattedOperations = props.transaction.operations.map(formatOperation)
    return (
      <ListItemText
        primary={<span>{dedupe(formattedOperations).join(", ")}</span>}
        primaryTypographyProps={{ style: props.style }}
        secondary={secondary}
        style={props.style}
      />
    )
  }
}

function TransactionListItemBalance(props: {
  paymentSummary: ReturnType<typeof getPaymentSummary>
  style?: React.CSSProperties
}) {
  const { paymentSummary } = props
  const isSmallScreen = useIsMobile()
  return (
    <ListItemText primaryTypographyProps={{ align: "right" }} style={{ flexShrink: 0, ...props.style }}>
      {paymentSummary.length === 0 ? null : (
        <SingleBalance
          assetCode={paymentSummary[0].asset.getCode()}
          balance={paymentSummary[0].balanceChange.toString()}
          style={isSmallScreen ? { fontSize: "1rem" } : { fontSize: "1.6rem" }}
        />
      )}
    </ListItemText>
  )
}

interface TransactionListItemProps {
  accountPublicKey: string
  alwaysShowSource?: boolean
  createdAt: string
  hoverActions?: React.ReactElement<any>
  icon?: React.ReactElement<any>
  onOpenTransaction?: (transaction: Transaction) => void
  style?: React.CSSProperties
  transaction: Transaction
}

// tslint:disable-next-line no-shadowed-variable
export const TransactionListItem = React.memo(function TransactionListItem(props: TransactionListItemProps) {
  const [hovering, setHoveringStatus] = React.useState(false)
  const isSmallScreen = useIsMobile()
  const paymentSummary = getPaymentSummary(props.accountPublicKey, props.transaction)

  const { onOpenTransaction, transaction } = props
  const onOpen = onOpenTransaction ? () => onOpenTransaction(transaction) : undefined
  return (
    <ListItem
      button={Boolean(onOpen)}
      onClick={onOpen}
      onMouseEnter={() => setHoveringStatus(true)}
      onMouseLeave={() => setHoveringStatus(false)}
      style={{ paddingTop: 8, paddingBottom: 8, ...props.style }}
    >
      <ListItemIcon>
        {props.icon || <TransactionIcon paymentSummary={paymentSummary} transaction={props.transaction} />}
      </ListItemIcon>
      <TransactionItemText
        accountPublicKey={props.accountPublicKey}
        alwaysShowSource={props.alwaysShowSource}
        createdAt={props.createdAt}
        paymentSummary={paymentSummary}
        style={{
          fontSize: isSmallScreen ? "0.8rem" : undefined,
          fontWeight: "bold",
          overflow: "hidden",
          paddingRight: 0,
          textOverflow: "ellipsis"
        }}
        transaction={props.transaction}
      />
      {hovering && props.hoverActions ? (
        props.hoverActions
      ) : (
        <TransactionListItemBalance paymentSummary={paymentSummary} style={{ paddingRight: 0 }} />
      )}
    </ListItem>
  )
})

function TransactionList(props: {
  accountPublicKey: string
  background?: React.CSSProperties["background"]
  testnet: boolean
  title: React.ReactNode
  onOpenTransaction?: (transaction: Transaction) => void
  transactions: Transaction[]
}) {
  return (
    <List style={{ background: props.background }}>
      <ListSubheader disableSticky style={{ background: props.background }}>
        {props.title}
      </ListSubheader>
      {(props.transactions as TransactionWithUndocumentedProps[]).map(transaction => (
        <EntryAnimation
          key={createCheapTxID(transaction)}
          // Animate only if it's a new tx, not if we just haven't rendered it before
          animate={Date.now() - new Date(transaction.created_at).getTime() < 10_000}
        >
          <TransactionListItem
            key={createCheapTxID(transaction)}
            accountPublicKey={props.accountPublicKey}
            createdAt={transaction.created_at}
            transaction={transaction}
            onOpenTransaction={props.onOpenTransaction ? props.onOpenTransaction : undefined}
          />
        </EntryAnimation>
      ))}
    </List>
  )
}

export const InteractiveTransactionList = React.memo(
  (props: {
    account: Account
    testnet: boolean
    background?: string | number
    transactions: Transaction[]
    title: React.ReactNode
  }) => {
    if (props.transactions.length === 0) {
      return null
    }
    return (
      <TransactionViewer account={props.account}>
        {({ openDialog }) => (
          <TransactionList
            background={props.background}
            testnet={props.testnet}
            accountPublicKey={props.account.publicKey}
            onOpenTransaction={openDialog}
            transactions={props.transactions}
            title={props.title}
          />
        )}
      </TransactionViewer>
    )
  }
)

export default React.memo(TransactionList)
