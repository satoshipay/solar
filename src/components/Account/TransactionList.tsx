import React from "react"
import { Memo, Operation, Transaction } from "stellar-sdk"
import HumanTime from "react-human-time"
import List from "@material-ui/core/List"
import ListItem from "@material-ui/core/ListItem"
import ListItemIcon from "@material-ui/core/ListItemIcon"
import ListItemText from "@material-ui/core/ListItemText"
import ListSubheader from "@material-ui/core/ListSubheader"
import Tooltip from "@material-ui/core/Tooltip"
import CallMadeIcon from "@material-ui/icons/CallMade"
import CallReceivedIcon from "@material-ui/icons/CallReceived"
import SwapHorizIcon from "@material-ui/icons/SwapHoriz"
import CogIcon from "react-icons/lib/fa/cog"
import { getPaymentSummary, PaymentSummary } from "../../lib/paymentSummary"
import { selectNetwork } from "../../lib/transaction"
import PublicKey from "../PublicKey"
import { HumanReadableOperation } from "../TransactionSummary"
import { SingleBalance } from "./AccountBalances"

type TransactionWithUndocumentedProps = Transaction & {
  created_at: string
}

const MemoMessage = (props: { memo: Memo }) => {
  const memo = props.memo
  if (!memo.value) {
    return null
  } else if (Buffer.isBuffer(memo.value)) {
    return <>Memo: {memo.value.toString("hex")}</>
  } else {
    return <>Memo: {memo.value}</>
  }
}

const RemotePublicKeys = (props: { publicKeys: string[]; short?: boolean }) => {
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

const Time = (props: { time: Date }) => {
  return (
    <Tooltip title={<span style={{ fontSize: "110%" }}>{props.time.toLocaleString()}</span>}>
      <span>
        <HumanTime time={props.time.getTime()} />
      </span>
    </Tooltip>
  )
}

const TransactionIcon = (props: { paymentSummary: PaymentSummary }) => {
  if (props.paymentSummary.length === 0) {
    return <CogIcon />
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
  createdAt: Date
  paymentSummary: PaymentSummary
  transaction: Transaction
}

// TODO: Re-use code of transaction summary operation heading
const TransactionItemText = (props: TitleTextProps) => {
  const secondary = (
    <>
      <Time time={props.createdAt} />
      {props.transaction.memo.type !== "none" ? (
        <>
          &nbsp;&nbsp;|&nbsp;&nbsp;
          <MemoMessage memo={props.transaction.memo} />
        </>
      ) : null}
    </>
  )

  const remotePublicKeys = props.paymentSummary.reduce(
    (pubKeys, summaryItem) => pubKeys.concat(summaryItem.publicKeys),
    [] as string[]
  )

  if (remotePublicKeys.length > 0 && props.paymentSummary.every(summaryItem => summaryItem.balanceChange.gt(0))) {
    return (
      <ListItemText
        primary={
          <span>
            <RemotePublicKeys publicKeys={remotePublicKeys} />
          </span>
        }
        secondary={secondary}
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
            <RemotePublicKeys publicKeys={remotePublicKeys} short={props.alwaysShowSource} />
            {props.alwaysShowSource ? (
              <span>
                &nbsp;from <PublicKey publicKey={props.accountPublicKey} variant="short" />{" "}
              </span>
            ) : null}
          </span>
        }
        secondary={secondary}
      />
    )
  } else if (props.transaction.operations.length === 1 && props.transaction.operations[0].type === "changeTrust") {
    const operation = props.transaction.operations[0] as Operation.ChangeTrust

    return String(operation.limit) === "0" ? (
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
        secondary={secondary}
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
        secondary={secondary}
      />
    )
  } else {
    return (
      <ListItemText
        primary={
          <span>
            {props.transaction.operations.map((operation, index) => (
              <span key={index}>
                {index > 0 ? <>,&nbsp;</> : ""}
                <HumanReadableOperation key={index} operation={operation} />
              </span>
            ))}
          </span>
        }
        secondary={secondary}
      />
    )
  }
}

interface TransactionListItemProps {
  accountPublicKey: string
  alwaysShowSource?: boolean
  createdAt: string
  icon?: React.ReactElement<any>
  onClick?: () => void
  style?: React.CSSProperties
  transaction: Transaction
}

export const TransactionListItem = (props: TransactionListItemProps) => {
  const paymentSummary = getPaymentSummary(props.accountPublicKey, props.transaction)

  return (
    <ListItem button={Boolean(props.onClick)} onClick={props.onClick} style={props.style}>
      <ListItemIcon>{props.icon || <TransactionIcon paymentSummary={paymentSummary} />}</ListItemIcon>
      <TransactionItemText
        accountPublicKey={props.accountPublicKey}
        alwaysShowSource={props.alwaysShowSource}
        createdAt={new Date(props.createdAt)}
        paymentSummary={paymentSummary}
        transaction={props.transaction}
      />
      <ListItemText primaryTypographyProps={{ align: "right" }}>
        {paymentSummary.length === 0 ? null : (
          <SingleBalance
            assetCode={paymentSummary[0].asset.getCode()}
            balance={paymentSummary[0].balanceChange.toString()}
            style={{ fontSize: "1.6rem" }}
          />
        )}
      </ListItemText>
    </ListItem>
  )
}

const TransactionList = (props: {
  accountPublicKey: string
  background?: React.CSSProperties["background"]
  testnet: boolean
  title: React.ReactNode
  transactions: Transaction[]
}) => {
  // Need to select the right network, because `transaction.hash()` will fail if no network was selected
  selectNetwork(props.testnet)

  return (
    <List style={{ background: props.background }}>
      <ListSubheader disableSticky style={{ background: props.background }}>
        {props.title}
      </ListSubheader>
      {props.transactions.map(transaction => (
        <TransactionListItem
          key={transaction.hash().toString("hex")}
          accountPublicKey={props.accountPublicKey}
          createdAt={(transaction as TransactionWithUndocumentedProps).created_at}
          transaction={transaction}
        />
      ))}
    </List>
  )
}

export default TransactionList
