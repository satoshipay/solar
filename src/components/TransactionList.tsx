import React from 'react'
import BigNumber from 'big.js'
import ListSubheader from '@material-ui/core/ListSubheader'
import HumanTime from 'react-human-time'
import ArrowLeftIcon from 'react-icons/lib/fa/arrow-left'
import ArrowRightIcon from 'react-icons/lib/fa/arrow-right'
import SquareIcon from 'react-icons/lib/fa/square'
import { Operation, Transaction, TransactionOperation } from 'stellar-sdk'
import { withSpinner } from '../hocs'
import { List, ListItem } from './List'
import { Transactions } from './Subscribers'

type TransactionWithUndocumentedProps = Transaction & {
  created_at: string
}

const sumOperationAmountsBig = (ops: TransactionOperation[]) => (
  ops
    .filter(op => op.type === 'payment' || op.type === 'createAccount')
    .reduce((total, op: any) => total.add(BigNumber(op.amount || op.startingBalance)), BigNumber(0))
)

const TransactionIcon = (props: { balanceChangeBig: BigNumber }) => {
  if (props.balanceChangeBig.gt(0)) {
    return <ArrowLeftIcon />
  } else if (props.balanceChangeBig.lt(0)) {
    return <ArrowRightIcon />
  } else {
    return <SquareIcon />
  }
}

interface TitleTextProps {
  balanceChangeBig: BigNumber,
  incomingPaymentOps: TransactionOperation[],
  outgoingPaymentOps: TransactionOperation[],
  transaction: Transaction
}

const TitleText = (props: TitleTextProps) => {
  const DetailedInfo = ({ children }: { children: React.ReactNode }) => {
    return <small style={{ opacity: 0.8, fontSize: '75%' }}>{children}</small>
  }

  const { balanceChangeBig, incomingPaymentOps, outgoingPaymentOps, transaction } = props

  if (balanceChangeBig.gt(0)) {
    const source = (incomingPaymentOps[0] as any).source || transaction.source
    return <span>Received XLM {balanceChangeBig.toString()} <DetailedInfo>from {source}</DetailedInfo></span>
  } else if (balanceChangeBig.lt(0)) {
    const { destination } = outgoingPaymentOps[0] as any
    return <span>Sent XLM {balanceChangeBig.abs().toString()} <DetailedInfo>to {destination}</DetailedInfo></span>
  } else {
    return <>`Other transaction`</>
  }
}

const TransactionListItem = (props: { accountPublicKey: string, transaction: Transaction }) => {
  const { accountPublicKey, transaction } = props

  const paymentOps = transaction.operations.filter(op => op.type === 'payment' || op.type === 'createAccount') as any as Operation.Payment[]
  const incomingPaymentOps = paymentOps.filter(op => op.destination === accountPublicKey)
  const outgoingPaymentOps = paymentOps.filter(op => op.source === accountPublicKey || (!op.source && transaction.source === accountPublicKey))

  const balanceChangeBig = sumOperationAmountsBig(incomingPaymentOps).sub(sumOperationAmountsBig(outgoingPaymentOps))
  const primaryText = <TitleText balanceChangeBig={balanceChangeBig} incomingPaymentOps={incomingPaymentOps} outgoingPaymentOps={outgoingPaymentOps} transaction={transaction} />
  const createdAt = new Date((transaction as TransactionWithUndocumentedProps).created_at)

  return (
    <ListItem
      leftIcon={
        <span style={{ fontSize: '125%' }}>
          <TransactionIcon balanceChangeBig={balanceChangeBig} />
        </span>
      }
      heading={
        <small style={{ color: '#666', fontSize: '80%' }}>
          <HumanTime time={createdAt.getTime()} />
        </small>
      }
      primaryText={
        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {primaryText}
        </div>
      }
    />
    // TODO: Open transaction details on click
  )
}

const TransactionList = (props: { accountPublicKey: string, title: React.ReactNode, transactions: Transaction[] }) => {
  return (
    <List>
      <ListSubheader style={{ background: 'rgba(255, 255, 255, 0.8)' }}>{props.title}</ListSubheader>
      {props.transactions.map(
        (transaction, index) => (
          <TransactionListItem
            key={index}
            accountPublicKey={props.accountPublicKey}
            transaction={transaction}
          />
        )
      )}
    </List>
  )
}

export default TransactionList
