import React from "react"
import Typography from "@material-ui/core/Typography"
import { Memo, Operation, Transaction, TransactionOperation } from "stellar-sdk"
import { SingleBalance } from "./Account/AccountBalances"
import { trustlineLimitEqualsUnlimited } from "../lib/stellar"
import { List, ListItem } from "./List"
import PublicKey from "./PublicKey"

// TODO: Use <AccountName /> everywhere, instead of just <small>

const uppercaseFirstLetter = (str: string) => str[0].toUpperCase() + str.slice(1)

function prettifyCamelcase(identifier: string) {
  const prettified = identifier.replace(/[A-Z]/g, letter => ` ${letter.toLowerCase()}`)
  return prettified.charAt(0).toUpperCase() + prettified.substr(1)
}

function prettifyOperationObject(operation: TransactionOperation) {
  const operationPropNames = Object.keys(operation)
    .filter(key => key !== "type")
    .filter(propName => Boolean((operation as any)[propName]))

  const operationDetailLines = operationPropNames.map(
    propName => `${prettifyCamelcase(propName)}: ${JSON.stringify((operation as any)[propName], null, 2)}`
  )
  return operationDetailLines.join("\n")
}

export const HumanReadableOperation = (props: { operation: TransactionOperation }) => {
  const formattedType = uppercaseFirstLetter(props.operation.type.replace(/([A-Z])/g, letter => " " + letter))
  return <>{formattedType}</>
}

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
        <SingleBalance assetCode={asset.code} balance={String(amount)} />
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
      <div>
        <SingleBalance assetCode="XLM" balance={String(startingBalance)} />
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

const SetOptionsOperation = (props: { operation: Operation.SetOptions; style?: React.CSSProperties }) => {
  let heading = <></>
  let primaryText = (
    <OperationDetails>
      <pre style={{ fontFamily: "inherit", fontSize: "90%" }}>{prettifyOperationObject(props.operation)}</pre>
    </OperationDetails>
  )

  if (props.operation.signer && typeof props.operation.signer.weight === "number") {
    const signerPublicKey = String(props.operation.signer.ed25519PublicKey)
    if (props.operation.signer.weight > 0) {
      heading = <>Add signer</>
      primaryText = (
        <OperationDetails>
          <PublicKey publicKey={signerPublicKey} variant="full" />
        </OperationDetails>
      )
    } else if (props.operation.signer.weight === 0) {
      heading = <>Remove signer</>
      primaryText = (
        <OperationDetails>
          <PublicKey publicKey={signerPublicKey} variant="full" />
        </OperationDetails>
      )
    }
  } else if (props.operation.lowThreshold || props.operation.medThreshold || props.operation.highThreshold) {
    heading = <>Change key thresholds</>
  }
  return <ListItem heading={heading} primaryText={primaryText} style={props.style} />
}

const DefaultOperation = (props: { operation: TransactionOperation; style?: React.CSSProperties }) => {
  return (
    <ListItem
      heading={
        <Typography>
          <HumanReadableOperation operation={props.operation} />
        </Typography>
      }
      primaryText={
        <OperationDetails>
          <pre style={{ fontFamily: "inherit", fontSize: "90%" }}>{prettifyOperationObject(props.operation)}</pre>
        </OperationDetails>
      }
      style={props.style}
    />
  )
}

const SourceAccount = (props: { transaction: Transaction; style?: React.CSSProperties }) => {
  return (
    <ListItem
      heading="Source Account"
      primaryText={
        <OperationDetails>
          <PublicKey
            publicKey={props.transaction.source}
            style={{ fontWeight: "normal", fontSize: "inherit" }}
            variant="short"
          />
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
  } else if (props.operation.type === "setOptions") {
    return <SetOptionsOperation operation={props.operation} style={props.style} />
  } else {
    return <DefaultOperation operation={props.operation} style={props.style} />
  }
}

const TransactionSummary = (props: { showSource?: boolean; transaction: Transaction }) => {
  const noHPaddingStyle = {
    paddingLeft: 0,
    paddingRight: 0
  }
  return (
    <List>
      {props.transaction.operations.map((operation, index) => (
        <TransactionOperation key={index} operation={operation} style={noHPaddingStyle} />
      ))}
      <TransactionMemo memo={props.transaction.memo} style={noHPaddingStyle} />
      {props.showSource ? <SourceAccount transaction={props.transaction} style={noHPaddingStyle} /> : null}
    </List>
  )
}

export default TransactionSummary
