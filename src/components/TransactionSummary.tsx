import React from "react"
import ListSubheader from "@material-ui/core/ListSubheader"
import Typography from "@material-ui/core/Typography"
import { Memo, Operation, Transaction, TransactionOperation } from "stellar-sdk"
import { trustlineLimitEqualsUnlimited } from "../lib/stellar"
import { formatOperationType } from "../lib/transaction"
import { List, ListItem } from "./List"

// TODO: Use <AccountName /> everywhere, instead of just <small>

const OperationDetails = (props: { children: React.ReactNode }) => (
  <div style={{ fontSize: "80%", marginTop: 8, marginLeft: 16 }}>{props.children}</div>
)

const TransactionMemo = (props: { memo: Memo; style?: React.CSSProperties }) => {
  if (props.memo.type === "none" || !props.memo.value) return null

  const typeLabel = props.memo.type.substr(0, 1).toUpperCase() + props.memo.type.substr(1)

  return (
    <ListItem
      heading={<Typography color="textSecondary">{typeLabel} Memo</Typography>}
      primaryText={typeof props.memo.value === "string" ? props.memo.value : props.memo.value.toString("hex")}
      style={props.style}
    />
  )
}

const PaymentOperation = (props: { operation: Operation.Payment; style?: React.CSSProperties }) => {
  const { amount, asset, destination } = props.operation
  const content = (
    <OperationDetails>
      <div>
        {amount} {asset.code}
      </div>
      <div>
        <div>
          to <small>{destination}</small>
        </div>
        {props.operation.source ? (
          <div>
            from <small>{props.operation.source}</small>
          </div>
        ) : null}
      </div>
    </OperationDetails>
  )
  return <ListItem heading="Payment" primaryText={content} style={props.style} />
}

const CreateAccountOperation = (props: { operation: Operation.CreateAccount; style?: React.CSSProperties }) => {
  const { startingBalance, destination } = props.operation
  const content = (
    <OperationDetails>
      <div>{startingBalance} XLM</div>
      <div>
        <div>
          to <small>{destination}</small>
        </div>
        {props.operation.source ? (
          <div>
            from <small>{props.operation.source}</small>
          </div>
        ) : null}
      </div>
    </OperationDetails>
  )
  return <ListItem heading="Create account" primaryText={content} style={props.style} />
}

const ChangeTrustOperation = (props: { operation: Operation.ChangeTrust; style?: React.CSSProperties }) => {
  if (String(props.operation.limit) === "0") {
    const content = (
      <OperationDetails>
        {props.operation.line.code} by <small>{props.operation.line.issuer}</small>
      </OperationDetails>
    )
    return <ListItem heading="Remove trust in asset" primaryText={content} style={props.style} />
  } else {
    const content = (
      <OperationDetails>
        <div>
          {props.operation.line.code} by <small>{props.operation.line.issuer}</small>
        </div>
        <div>
          {trustlineLimitEqualsUnlimited(props.operation.limit)
            ? "Unlimited trust"
            : `Limited to ${props.operation.limit}`}
        </div>
      </OperationDetails>
    )
    return <ListItem heading="Trust asset" primaryText={content} style={props.style} />
  }
}

const DefaultOperation = (props: { operation: TransactionOperation; style?: React.CSSProperties }) => {
  const operationPropNames = Object.keys(props.operation)
    .filter(key => key !== "type")
    .filter(propName => Boolean((props.operation as any)[propName]))

  const operationDetailLines = operationPropNames.map(
    propName => `${propName}: ${JSON.stringify((props.operation as any)[propName], null, 2)}`
  )
  const operationDetails = operationDetailLines.join("\n")

  return (
    <ListItem
      heading={<Typography color="textSecondary">{formatOperationType(props.operation.type)}</Typography>}
      primaryText={
        <OperationDetails>
          <pre style={{ fontSize: "90%" }}>{operationDetails}</pre>
        </OperationDetails>
      }
      style={props.style}
    />
  )
}

const TransactionOperation = (props: { operation: TransactionOperation; style?: React.CSSProperties }) => {
  // TODO: Add more operation types!

  if (props.operation.type === "payment") {
    return <PaymentOperation operation={props.operation} style={props.style} />
  } else if (props.operation.type === "createAccount") {
    return <CreateAccountOperation operation={props.operation} style={props.style} />
  } else if (props.operation.type === "changeTrust") {
    return <ChangeTrustOperation operation={props.operation} style={props.style} />
  } else {
    return <DefaultOperation operation={props.operation} style={props.style} />
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
      {props.transaction.operations.map((operation, index) => (
        <TransactionOperation key={index} operation={operation} style={noHPaddingStyle} />
      ))}
      <TransactionMemo memo={props.transaction.memo} style={noHPaddingStyle} />
    </List>
  )
}

export default TransactionSummary
