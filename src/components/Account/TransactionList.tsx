import BigNumber from "big.js"
import React from "react"
import { Asset, Operation, Transaction } from "stellar-sdk"
import HumanTime from "react-human-time"
import Collapse from "@material-ui/core/Collapse"
import List from "@material-ui/core/List"
import ListItem from "@material-ui/core/ListItem"
import ListItemIcon from "@material-ui/core/ListItemIcon"
import ListItemText from "@material-ui/core/ListItemText"
import ListSubheader from "@material-ui/core/ListSubheader"
import Tooltip from "@material-ui/core/Tooltip"
import withStyles, { ClassNameMap, StyleRules } from "@material-ui/core/styles/withStyles"
import CallMadeIcon from "@material-ui/icons/CallMade"
import CallReceivedIcon from "@material-ui/icons/CallReceived"
import SettingsIcon from "@material-ui/icons/Settings"
import SwapHorizIcon from "@material-ui/icons/SwapHoriz"
import { Account } from "../../context/accounts"
import { useIsMobile } from "../../hooks"
import { getPaymentSummary, PaymentSummary } from "../../lib/paymentSummary"
import { createCheapTxID } from "../../lib/transaction"
import { PublicKey } from "../PublicKey"
import MemoMessage from "../Stellar/MemoMessage"
import TransactionReviewDialog from "../TransactionReview/TransactionReviewDialog"
import { formatOperation } from "../TransactionReview/Operations"
import { formatBalance, SingleBalance } from "./AccountBalances"

type TransactionWithUndocumentedProps = Transaction & {
  created_at: string
}

const isMobileDevice = process.env.PLATFORM === "android" || process.env.PLATFORM === "ios"

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
  } else if (props.transaction.operations.every(operation => operation.type === "accountMerge")) {
    return <CallReceivedIcon />
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
  showMemo: boolean
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
      {props.showMemo && props.transaction.memo.type !== "none" ? (
        <>
          &nbsp;&nbsp;|&nbsp;&nbsp;
          <MemoMessage prefix={<>Memo:&nbsp;</>} memo={props.transaction.memo} />
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

export const transactionListItemStyles: StyleRules = {
  listItem: {
    paddingTop: 8,
    paddingBottom: 8,
    background: "#FFFFFF",
    boxShadow: "0 8px 16px 0 rgba(0, 0, 0, 0.1)",
    "&:focus": {
      backgroundColor: "#FFFFFF"
    },
    "&:hover": {
      backgroundColor: isMobileDevice ? "#FFFFFF" : "rgb(232, 232, 232)"
    }
  }
}

interface TransactionListItemProps {
  accountPublicKey: string
  alwaysShowSource?: boolean
  classes: ClassNameMap<keyof typeof transactionListItemStyles>
  createdAt: string
  icon?: React.ReactElement<any>
  onOpenTransaction?: (transaction: Transaction) => void
  style?: React.CSSProperties
  showMemo: boolean
  transaction: Transaction
}

export const TransactionListItem = React.memo(
  // tslint:disable-next-line no-shadowed-variable
  withStyles(transactionListItemStyles)(function TransactionListItem(props: TransactionListItemProps) {
    const isSmallScreen = useIsMobile()
    const paymentSummary = getPaymentSummary(props.accountPublicKey, props.transaction)

    const { classes, onOpenTransaction, transaction } = props
    const onOpen = onOpenTransaction ? () => onOpenTransaction(transaction) : undefined

    return (
      <ListItem
        button={Boolean(onOpen)}
        className={classes.listItem}
        component="li"
        onClick={onOpen}
        style={props.style}
      >
        <ListItemIcon>
          {props.icon || <TransactionIcon paymentSummary={paymentSummary} transaction={props.transaction} />}
        </ListItemIcon>
        <TransactionItemText
          accountPublicKey={props.accountPublicKey}
          alwaysShowSource={props.alwaysShowSource}
          createdAt={props.createdAt}
          paymentSummary={paymentSummary}
          showMemo={props.showMemo}
          style={{
            fontSize: isSmallScreen ? "0.8rem" : undefined,
            fontWeight: "bold",
            overflow: "hidden",
            paddingRight: 0,
            textOverflow: "ellipsis"
          }}
          transaction={props.transaction}
        />
        <TransactionListItemBalance paymentSummary={paymentSummary} style={{ paddingRight: 0 }} />
      </ListItem>
    )
  } as React.ComponentType<TransactionListItemProps>)
)

function TransactionList(props: {
  account: Account
  background?: React.CSSProperties["background"]
  showMemos: boolean
  testnet: boolean
  title: React.ReactNode
  onOpenTransaction?: (transaction: Transaction) => void
  transactions: Transaction[]
}) {
  const [openedTransaction, setOpenTransaction] = React.useState<Transaction | null>(null)

  const closeTransaction = React.useCallback(() => {
    setOpenTransaction(null)

    // A little hack to prevent :focus style being set again on list item after closing the dialog
    setTimeout(() => {
      if (document.activeElement) {
        ;(document.activeElement as HTMLElement).blur()
      }
    }, 0)
  }, [])

  if (props.transactions.length === 0) {
    return null
  }

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
            accountPublicKey={props.account.publicKey}
            createdAt={transaction.created_at}
            showMemo={props.showMemos}
            transaction={transaction}
            onOpenTransaction={() => setOpenTransaction(transaction)}
          />
        </EntryAnimation>
      ))}
      <TransactionReviewDialog
        open={openedTransaction !== null}
        account={props.account}
        disabled={true}
        showSource
        transaction={openedTransaction}
        onClose={closeTransaction}
        onSubmitTransaction={() => undefined}
      />
    </List>
  )
}

export default React.memo(TransactionList)
