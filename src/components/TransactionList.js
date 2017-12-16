import React from 'react'
import BigNumber from 'big.js'
import { List, ListItem } from './List'
import Subheader from 'material-ui/Subheader'
import HumanTime from 'react-human-time'
import ArrowLeftIcon from 'react-icons/lib/fa/arrow-left'
import ArrowRightIcon from 'react-icons/lib/fa/arrow-right'
import SquareIcon from 'react-icons/lib/fa/square'
import { derivePublicKey } from '../lib/key'
import { withTransactions } from '../hocs'

const sumOperationAmountsBig = ops => (
  ops
    .filter(op => op.type === 'payment')
    .reduce((total, op) => total.add(BigNumber(op.amount)), BigNumber(0))
)

const getBalanceChangeBig = ({ publicKey, tx }) => {
  const paymentOps = tx.operations.filter(op => op.type === 'payment')
  const incomingPaymentOps = paymentOps.filter(op => op.destination === publicKey)
  const outgoingPaymentOps = paymentOps.filter(op => op.source === publicKey || (!op.source && tx.source === publicKey))

  const balanceChangeBig = sumOperationAmountsBig(incomingPaymentOps).sub(sumOperationAmountsBig(outgoingPaymentOps))
  return balanceChangeBig
}

const TransactionIcon = ({ balanceChangeBig }) => {
  if (balanceChangeBig.gt(0)) {
    return <ArrowLeftIcon />
  } else if (balanceChangeBig.lt(0)) {
    return <ArrowRightIcon />
  } else {
    return <SquareIcon />
  }
}

const TitleText = ({ balanceChangeBig }) => {
  if (balanceChangeBig.gt(0)) {
    return `Received XLM ${balanceChangeBig}`
  } else if (balanceChangeBig.lt(0)) {
    return `Sent XLM ${balanceChangeBig.abs()}`
  } else {
    return `Other transaction`
  }
}

const TransactionListItem = ({ publicKey, tx }) => {
  const balanceChangeBig = getBalanceChangeBig({ publicKey, tx })
  return (
    <ListItem
      leftIcon={<span style={{ fontSize: '125%' }}><TransactionIcon balanceChangeBig={balanceChangeBig} /></span>}
      heading={<small style={{ color: '#666', fontSize: '80%' }}><HumanTime time={tx.created_at} /></small>}
      primaryText={<div><TitleText balanceChangeBig={balanceChangeBig} /></div>}
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

const AccountTransactionList = ({ publicKey, testnet = false }) => {
  const Component = withTransactions({ publicKey, testnet })(TransactionList)
  return <Component publicKey={publicKey} />
}

export default AccountTransactionList
