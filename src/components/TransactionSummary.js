import React from 'react'
import Subheader from 'material-ui/Subheader'
import { List, ListItem } from './List'

const TransactionMemo = ({ memo }) => (
  null  // TODO: Render something useful if `memo.type` !== `none`
)

const TransactionOperation = ({ operation }) => {
  const Content = ({ children }) => (
    <div style={{ fontSize: '80%', marginTop: 8 }}>
      {children}
    </div>
  )

  // TODO: Add more operation types!

  if (operation.type === 'payment') {
    const { amount, asset, destination } = operation
    const content = (
      <Content>
        <div>{amount} {asset.code}</div>
        <div>
          <div>to <small>{destination}</small></div>
          {operation.source ? <div>from <small>{operation.source}</small></div> : null}
        </div>
      </Content>
    )
    return <ListItem heading='Payment' primaryText={content} />
  } else {
    const operationPropNames = Object.keys(operation).filter(key => key !== 'type')
    const content = (
      <Content>
        {operationPropNames.map(
          propName => {
            const value = JSON.stringify(operation[propName])
            return <div key={propName}>{propName}: {value}</div>
          }
        )}
      </Content>
    )
    return <ListItem heading={<span style={{ color: 'red' }}>operation.type</span>} primaryText={content} />
  }
}

const TransactionSummary = ({ transaction }) => {
  return (
    <List>
      <Subheader>Transaction summary</Subheader>
      <TransactionMemo memo={transaction.memo} />
      {transaction.operations.map(
        (operation, index) => <TransactionOperation key={index} operation={operation} />
      )}
    </List>
  )
}

export default TransactionSummary
