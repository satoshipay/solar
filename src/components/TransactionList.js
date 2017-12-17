import React from 'react'
import BigNumber from 'big.js'
import Subheader from 'material-ui/Subheader'
import HumanTime from 'react-human-time'
import ArrowLeftIcon from 'react-icons/lib/fa/arrow-left'
import ArrowRightIcon from 'react-icons/lib/fa/arrow-right'
import SquareIcon from 'react-icons/lib/fa/square'
import { List, ListItem } from './List'
import { withSpinner, withTransactions } from '../hocs'

const sumOperationAmountsBig = ops => (
  ops
    .filter(op => op.type === 'payment')
    .reduce((total, op) => total.add(BigNumber(op.amount)), BigNumber(0))
)

const TransactionIcon = ({ balanceChangeBig }) => {
  if (balanceChangeBig.gt(0)) {
    return <ArrowLeftIcon />
  } else if (balanceChangeBig.lt(0)) {
    return <ArrowRightIcon />
  } else {
    return <SquareIcon />
  }
}

const TitleText = ({ balanceChangeBig, incomingPaymentOps, outgoingPaymentOps, tx }) => {
  const DetailedInfo = ({ children }) => <small style={{ opacity: 0.8, fontSize: '75%' }}>{children}</small>

  if (balanceChangeBig.gt(0)) {
    const source = incomingPaymentOps[0].source || tx.source
    return <span>Received XLM {balanceChangeBig.toString()} <DetailedInfo>from {source}</DetailedInfo></span>
  } else if (balanceChangeBig.lt(0)) {
    const { destination } = outgoingPaymentOps[0]
    return <span>Sent XLM {balanceChangeBig.abs().toString()} <DetailedInfo>to {destination}</DetailedInfo></span>
  } else {
    return `Other transaction`
  }
}

const TransactionListItem = ({ publicKey, tx }) => {
  const paymentOps = tx.operations.filter(op => op.type === 'payment')
  const incomingPaymentOps = paymentOps.filter(op => op.destination === publicKey)
  const outgoingPaymentOps = paymentOps.filter(op => op.source === publicKey || (!op.source && tx.source === publicKey))

  const balanceChangeBig = sumOperationAmountsBig(incomingPaymentOps).sub(sumOperationAmountsBig(outgoingPaymentOps))
  const primaryText = <TitleText balanceChangeBig={balanceChangeBig} incomingPaymentOps={incomingPaymentOps} outgoingPaymentOps={outgoingPaymentOps} tx={tx} />

  return (
    <ListItem
      leftIcon={<span style={{ fontSize: '125%' }}><TransactionIcon balanceChangeBig={balanceChangeBig} /></span>}
      heading={<small style={{ color: '#666', fontSize: '80%' }}><HumanTime time={tx.created_at} /></small>}
      primaryText={<div style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{primaryText}</div>}
    />
    // TODO: Open tx details on click
  )
}

const TransactionList = ({ publicKey, title, transactions }) => {
  return (
    <List>
      <Subheader>{title}</Subheader>
      {transactions.map(tx => <TransactionListItem key={tx.hash()} publicKey={publicKey} tx={tx} />)}
    </List>
  )
}

const AccountTransactionList = ({ publicKey, testnet = false, title }) => {
  const Component = withTransactions({ publicKey, testnet })(withSpinner(TransactionList))
  return <Component publicKey={publicKey} title={title} />
}

export default AccountTransactionList
