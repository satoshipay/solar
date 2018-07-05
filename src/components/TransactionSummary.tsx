import React from 'react'
import ListSubheader from '@material-ui/core/ListSubheader'
import Typography from '@material-ui/core/Typography'
import { Memo, Operation, Transaction, TransactionOperation } from 'stellar-sdk'
import { List, ListItem } from './List'

const OperationContent = ({ children }: { children: React.ReactNode }) => (
  <div style={{ fontSize: '80%', marginTop: 8 }}>
    {children}
  </div>
)

const TransactionMemo = (props: { memo: Memo }) => (
  null  // TODO: Render something useful if `memo.type` !== `none`
)

const PaymentOperationListItem = (props: { operation: Operation.Payment, style?: React.CSSProperties }) => {
  const { amount, asset, destination } = props.operation
  const content = (
    <OperationContent>
      <div>{amount} {asset.code}</div>
      <div>
        <div>to <small>{destination}</small></div>
        {props.operation.source ? <div>from <small>{props.operation.source}</small></div> : null}
      </div>
    </OperationContent>
  )
  return <ListItem heading='Payment' primaryText={content} style={props.style} />
}

const CreateAccountOperationListItem = (props: { operation: Operation.CreateAccount, style?: React.CSSProperties }) => {
  const { startingBalance, destination } = props.operation
  const content = (
    <OperationContent>
      <div>{startingBalance} XLM</div>
      <div>
        <div>to <small>{destination}</small></div>
        {props.operation.source ? <div>from <small>{props.operation.source}</small></div> : null}
      </div>
    </OperationContent>
  )
  return <ListItem heading='Create account' primaryText={content} style={props.style} />
}

const DefaultOperationListItem = (props: { operation: TransactionOperation, style?: React.CSSProperties }) => {
  const operationPropNames = Object.keys(props.operation).filter(key => key !== 'type')
  const content = (
    <OperationContent>
      {operationPropNames.filter(propName => Boolean((props.operation as any)[propName])).map(
        propName => {
          const value = JSON.stringify((props.operation as any)[propName])
          return <div key={propName}>{propName}: {value}</div>
        }
      )}
    </OperationContent>
  )
  return (
    <ListItem
      heading={<Typography color='textSecondary'>{props.operation.type}</Typography>}
      primaryText={content}
      style={props.style}
    />
  )
}

const TransactionOperation = (props: { operation: TransactionOperation, style?: React.CSSProperties }) => {
  // TODO: Add more operation types!

  if (props.operation.type === 'payment') {
    return <PaymentOperationListItem operation={props.operation} style={props.style} />
  } else if (props.operation.type === 'createAccount') {
    return <CreateAccountOperationListItem operation={props.operation} style={props.style} />
  } else {
    return <DefaultOperationListItem operation={props.operation} style={props.style} />
  }
}

const TransactionSummary = (props: { transaction: Transaction }) => {
  const noHPaddingStyle = {
    paddingLeft: 0,
    paddingRight: 0
  }
  return (
    <List>
      <ListSubheader style={noHPaddingStyle}>Transaction summary</ListSubheader>
      <TransactionMemo memo={props.transaction.memo} />
      {props.transaction.operations.map(
        (operation, index) => <TransactionOperation key={index} operation={operation} style={noHPaddingStyle} />
      )}
    </List>
  )
}

export default TransactionSummary
