import React from "react"
import { AccountResponse, Operation, Transaction } from "stellar-sdk"
import HumanTime from "react-human-time"
import ArrowLeftIcon from "react-icons/lib/fa/arrow-left"
import ArrowRightIcon from "react-icons/lib/fa/arrow-right"
import CogIcon from "react-icons/lib/fa/cog"
import ExchangeIcon from "react-icons/lib/fa/exchange"
import ListSubheader from "@material-ui/core/ListSubheader"
import Tooltip from "@material-ui/core/Tooltip"
import { getPaymentSummary, PaymentSummary } from "../../lib/paymentSummary"
import { selectNetwork } from "../../lib/transaction"
import { HorizontalLayout } from "../Layout/Box"
import { List, ListItem } from "../List"
import ShortPublicKey from "../ShortPublicKey"
import { HumanReadableOperation } from "../TransactionSummary"
import { MultipleBalances } from "./AccountBalances"

type TransactionWithUndocumentedProps = Transaction & {
  created_at: string
}

const TransactionIcon = (props: { paymentSummary: PaymentSummary }) => {
  if (props.paymentSummary.length === 0) {
    return <CogIcon />
  } else if (props.paymentSummary.every(summaryItem => summaryItem.balanceChange.gt(0))) {
    return <ArrowLeftIcon />
  } else if (props.paymentSummary.every(summaryItem => summaryItem.balanceChange.lt(0))) {
    return <ArrowRightIcon />
  } else {
    return <ExchangeIcon />
  }
}

const DetailedInfo = (props: { children: React.ReactNode }) => {
  return <small style={{ opacity: 0.8, fontSize: "75%" }}>{props.children}</small>
}

const RemotePublicKeys = (props: { publicKeys: string[] }) => {
  if (props.publicKeys.length === 0) {
    return <>-</>
  } else if (props.publicKeys.length === 1) {
    return <ShortPublicKey publicKey={props.publicKeys[0]} variant="short" />
  } else {
    return (
      <>
        <ShortPublicKey publicKey={props.publicKeys[0]} variant="short" /> <i>+ {props.publicKeys.length - 1} more</i>
      </>
    )
  }
}

interface TitleTextProps {
  accountPublicKey: string
  alwaysShowSource?: boolean
  paymentSummary: PaymentSummary
  transaction: Transaction
}

const TitleText = (props: TitleTextProps) => {
  const balanceChanges = props.paymentSummary.map(
    ({ asset, balanceChange }) =>
      asset.isNative()
        ? {
            asset_type: "native",
            balance: balanceChange.abs().toString()
          }
        : {
            asset_code: asset.getCode(),
            asset_issuer: asset.getIssuer(),
            asset_type: asset.getAssetType(),
            balance: balanceChange.abs().toString()
          }
  ) as AccountResponse["balances"]

  const remotePublicKeys = props.paymentSummary.reduce(
    (pubKeys, summaryItem) => pubKeys.concat(summaryItem.publicKeys),
    [] as string[]
  )

  if (remotePublicKeys.length > 0 && props.paymentSummary.every(summaryItem => summaryItem.balanceChange.gt(0))) {
    return (
      <span>
        Receive <MultipleBalances balances={balanceChanges} inline />{" "}
        <DetailedInfo>
          from <RemotePublicKeys publicKeys={remotePublicKeys} />
        </DetailedInfo>
      </span>
    )
  } else if (
    remotePublicKeys.length > 0 &&
    props.paymentSummary.every(summaryItem => summaryItem.balanceChange.lt(0))
  ) {
    return (
      <span>
        Send <MultipleBalances balances={balanceChanges} inline />{" "}
        <DetailedInfo>
          {props.alwaysShowSource ? (
            <span>
              from <ShortPublicKey publicKey={props.accountPublicKey} variant="short" />{" "}
            </span>
          ) : null}
          to <RemotePublicKeys publicKeys={remotePublicKeys} />
        </DetailedInfo>
      </span>
    )
  } else if (props.transaction.operations.length === 1 && props.transaction.operations[0].type === "changeTrust") {
    const operation = props.transaction.operations[0] as Operation.ChangeTrust

    return String(operation.limit) === "0" ? (
      <>
        Remove trust in asset {operation.line.code}
        {props.alwaysShowSource ? (
          <>
            {" "}
            (<ShortPublicKey publicKey={props.accountPublicKey} variant="short" />)
          </>
        ) : null}
      </>
    ) : (
      <>
        Trust asset {operation.line.code}
        {props.alwaysShowSource ? (
          <>
            {" "}
            (<ShortPublicKey publicKey={props.accountPublicKey} variant="short" />)
          </>
        ) : null}
      </>
    )
  } else {
    return (
      <>
        {props.transaction.operations.map((operation, index) => (
          <span key={index}>
            {index > 0 ? <>,&nbsp;</> : ""}
            <HumanReadableOperation key={index} operation={operation} />
          </span>
        ))}
      </>
    )
  }
}

const TooltipTitle = (props: { children: React.ReactNode }) => {
  return <span style={{ fontSize: "110%" }}>{props.children}</span>
}

interface TransactionListItemProps {
  accountPublicKey: string
  alwaysShowSource?: boolean
  createdAt: string
  icon?: React.ReactNode
  onClick?: () => void
  transaction: Transaction
}

export const TransactionListItem = (props: TransactionListItemProps) => {
  const createdAt = new Date(props.createdAt)
  const paymentSummary = getPaymentSummary(props.accountPublicKey, props.transaction)

  return (
    <ListItem
      leftIcon={
        <span style={{ fontSize: "125%" }}>{props.icon || <TransactionIcon paymentSummary={paymentSummary} />}</span>
      }
      heading={
        <Tooltip title={<TooltipTitle>{createdAt.toLocaleString()}</TooltipTitle>}>
          <small style={{ color: "#666", fontSize: "80%" }}>
            <HumanTime time={createdAt.getTime()} />
          </small>
        </Tooltip>
      }
      primaryText={
        <HorizontalLayout>
          <div style={{ flexGrow: 1, overflow: "hidden", textOverflow: "ellipsis" }}>
            <TitleText
              accountPublicKey={props.accountPublicKey}
              alwaysShowSource={props.alwaysShowSource}
              paymentSummary={paymentSummary}
              transaction={props.transaction}
            />
          </div>
          {/* TODO: Action buttons */}
        </HorizontalLayout>
      }
      onClick={props.onClick}
    />
  )
}

export const TransactionList = (props: {
  accountPublicKey: string
  testnet: boolean
  title: React.ReactNode
  transactions: Transaction[]
}) => {
  // Need to select the right network, because `transaction.hash()` will fail if no network was selected
  selectNetwork(props.testnet)

  return (
    <List>
      <ListSubheader>{props.title}</ListSubheader>
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
