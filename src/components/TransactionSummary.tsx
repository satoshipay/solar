import React from 'react'
import Subheader from 'material-ui/Subheader'
import { Memo, Transaction, TransactionOperation } from 'stellar-sdk'
import { List, ListItem } from './List'

const TransactionMemo = (props: { memo: Memo }) => (
  null  // TODO: Render something useful if `memo.type` !== `none`
)

const TransactionOperation = (props: { operation: TransactionOperation }) => {
  const Content = ({ children }: { children: React.ReactNode }) => (
    <div style={{ fontSize: '80%', marginTop: 8 }}>
      {children}
    </div>
  )

  // TODO: Add more operation types!

  if (props.operation.type === 'payment') {
    const { amount, asset, destination } = props.operation
    const content = (
      <Content>
        <div>{amount} {asset.code}</div>
        <div>
          <div>to <small>{destination}</small></div>
          {props.operation.source ? <div>from <small>{props.operation.source}</small></div> : null}
        </div>
      </Content>
    )
    return <ListItem heading='Payment' primaryText={content} />
  } else {
    const operationPropNames = Object.keys(props.operation).filter(key => key !== 'type')
    const content = (
      <Content>
        {operationPropNames.map(
          propName => {
            const value = JSON.stringify((props.operation as any)[propName])
            return <div key={propName}>{propName}: {value}</div>
          }
        )}
      </Content>
    )
    return <ListItem heading={<span style={{ color: 'red' }}>operation.type</span>} primaryText={content} />
  }
}

const TransactionSummary = (props: { transaction: Transaction }) => {
  return (
    <List>
      <Subheader>Transaction summary</Subheader>
      <TransactionMemo memo={props.transaction.memo} />
      {props.transaction.operations.map(
        (operation, index) => <TransactionOperation key={index} operation={operation} />
      )}
    </List>
  )
}

export default TransactionSummary
