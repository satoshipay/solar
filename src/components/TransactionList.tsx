import React from 'react'
import BigNumber from 'big.js'
import ListSubheader from '@material-ui/core/ListSubheader'
import HumanTime from 'react-human-time'
import ArrowLeftIcon from 'react-icons/lib/fa/arrow-left'
import ArrowRightIcon from 'react-icons/lib/fa/arrow-right'
import SquareIcon from 'react-icons/lib/fa/square'
import { Operation, Transaction, TransactionOperation } from 'stellar-sdk'
import { List, ListItem } from './List'
import { Transactions } from '../data'
import { withSpinner } from '../hocs'

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
  tx: Transaction
}

const TitleText = (props: TitleTextProps) => {
  const DetailedInfo = ({ children }: { children: React.ReactNode }) => {
    return <small style={{ opacity: 0.8, fontSize: '75%' }}>{children}</small>
  }

  const { balanceChangeBig, incomingPaymentOps, outgoingPaymentOps, tx } = props

  if (balanceChangeBig.gt(0)) {
    const source = (incomingPaymentOps[0] as any).source || tx.source
    return <span>Received XLM {balanceChangeBig.toString()} <DetailedInfo>from {source}</DetailedInfo></span>
  } else if (balanceChangeBig.lt(0)) {
    const { destination } = outgoingPaymentOps[0] as any
    return <span>Sent XLM {balanceChangeBig.abs().toString()} <DetailedInfo>to {destination}</DetailedInfo></span>
  } else {
    return <>`Other transaction`</>
  }
}

const TransactionListItem = (props: { publicKey: string, tx: Transaction }) => {
  const { publicKey, tx } = props

  const paymentOps = tx.operations.filter(op => op.type === 'payment' || op.type === 'createAccount') as any as Operation.Payment[]
  const incomingPaymentOps = paymentOps.filter(op => op.destination === publicKey)
  const outgoingPaymentOps = paymentOps.filter(op => op.source === publicKey || (!op.source && tx.source === publicKey))

  const balanceChangeBig = sumOperationAmountsBig(incomingPaymentOps).sub(sumOperationAmountsBig(outgoingPaymentOps))
  const primaryText = <TitleText balanceChangeBig={balanceChangeBig} incomingPaymentOps={incomingPaymentOps} outgoingPaymentOps={outgoingPaymentOps} tx={tx} />
  const createdAt = new Date((tx as TransactionWithUndocumentedProps).created_at)

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
    // TODO: Open tx details on click
  )
}

const TransactionList = (props: { publicKey: string, title: React.ReactNode, transactions: Transaction[] }) => {
  return (
    <List>
      <ListSubheader>{props.title}</ListSubheader>
      {props.transactions.map(
        (tx: Transaction) => <TransactionListItem key={tx.hash().toString('base64')} publicKey={props.publicKey} tx={tx} />
      )}
    </List>
  )
}

const AccountTransactionList = (props: { publicKey: string, title: React.ReactNode, testnet: boolean }) => {
  const ListOrSpinner = withSpinner(TransactionList)

  return (
    <Transactions publicKey={props.publicKey} testnet={props.testnet}>
      {({ transactions }) => <ListOrSpinner publicKey={props.publicKey} title={props.title} transactions={transactions} />}
    </Transactions>
  )
}

export default AccountTransactionList
