import React from 'react'
import ListSubheader from '@material-ui/core/ListSubheader'
import { Memo, Transaction, TransactionOperation } from 'stellar-sdk'
import { List, ListItem } from './List'

const TransactionMemo = (props: { memo: Memo }) => (
  null  // TODO: Render something useful if `memo.type` !== `none`
)

const TransactionOperation = (props: { operation: TransactionOperation, style?: React.CSSProperties }) => {
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
    return <ListItem heading='Payment' primaryText={content} style={props.style} />
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
    return <ListItem heading={<span style={{ color: 'red' }}>operation.type</span>} primaryText={content} style={props.style} />
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
