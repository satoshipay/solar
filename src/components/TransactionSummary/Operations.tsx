import BigNumber from "big.js"
import React from "react"
import Typography from "@material-ui/core/Typography"
import { Operation, TransactionOperation, Asset } from "stellar-sdk"
import { formatBalance, SingleBalance } from "../Account/AccountBalances"
import { useAccountOffers, ObservedAccountData } from "../../hooks"
import { trustlineLimitEqualsUnlimited } from "../../lib/stellar"
import { ListItem } from "../List"
import PublicKey from "../PublicKey"

const uppercaseFirstLetter = (str: string) => str[0].toUpperCase() + str.slice(1)

function someThresholdSet(operation: Operation.SetOptions) {
  return (
    typeof operation.lowThreshold === "number" ||
    typeof operation.medThreshold === "number" ||
    typeof operation.highThreshold === "number"
  )
}

export function formatOperation(operation: TransactionOperation) {
  if (operation.type === "setOptions" && operation.signer && typeof operation.signer.weight === "number") {
    return operation.signer.weight > 0 ? "Add signer" : "Remove signer"
  } else if (operation.type === "setOptions" && someThresholdSet(operation)) {
    return "Change key threshold"
  } else {
    return uppercaseFirstLetter(operation.type.replace(/([A-Z])/g, letter => " " + letter))
  }
}

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

function OperationDetails(props: { children: React.ReactNode }) {
  return <div style={{ fontSize: "80%", marginTop: 8, marginLeft: 16 }}>{props.children}</div>
}

function PaymentOperation(props: { operation: Operation.Payment; style?: React.CSSProperties }) {
  const { amount, asset, destination } = props.operation
  const content = (
    <OperationDetails>
      <div>
        <SingleBalance assetCode={asset.code} balance={String(amount)} />
      </div>
      <div>
        <div>
          to <PublicKey publicKey={destination} style={{ fontWeight: "normal" }} variant="full" />
        </div>
        {props.operation.source ? (
          <div>
            from <PublicKey publicKey={props.operation.source} style={{ fontWeight: "normal" }} variant="full" />
          </div>
        ) : null}
      </div>
    </OperationDetails>
  )
  return <ListItem heading="Payment" primaryText={content} style={props.style} />
}

function CreateAccountOperation(props: { operation: Operation.CreateAccount; style?: React.CSSProperties }) {
  const { startingBalance, destination } = props.operation
  const content = (
    <OperationDetails>
      <div>
        <SingleBalance assetCode="XLM" balance={String(startingBalance)} />
      </div>
      <div>
        <div>
          to <PublicKey publicKey={destination} style={{ fontWeight: "normal" }} variant="full" />
        </div>
        {props.operation.source ? (
          <div>
            from <PublicKey publicKey={props.operation.source} style={{ fontWeight: "normal" }} variant="full" />
          </div>
        ) : null}
      </div>
    </OperationDetails>
  )
  return <ListItem heading="Create account" primaryText={content} style={props.style} />
}

function ChangeTrustOperation(props: { operation: Operation.ChangeTrust; style?: React.CSSProperties }) {
  if (String(props.operation.limit) === "0") {
    const content = (
      <OperationDetails>
        <b>{props.operation.line.code}</b> by{" "}
        <PublicKey publicKey={props.operation.line.issuer} style={{ fontWeight: "normal" }} variant="short" />
      </OperationDetails>
    )
    return <ListItem heading="Remove trust in asset" primaryText={content} style={props.style} />
  } else {
    const content = (
      <OperationDetails>
        <div>
          <b>{props.operation.line.code}</b> by{" "}
          <PublicKey publicKey={props.operation.line.issuer} style={{ fontWeight: "normal" }} variant="short" />
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

function OfferHeading(props: { amount: BigNumber; buying: Asset; offerId: string; selling: Asset }) {
  let prefix: string

  if (props.offerId === "0") {
    // Offer creation
    prefix = ""
  } else if (props.amount.eq(0)) {
    prefix = "Delete offer: "
  } else {
    prefix = "Update offer: "
  }

  return (
    <>
      {prefix}
      Sell {props.selling.code} for {props.buying.code}
    </>
  )
}

function OfferDetails(props: { amount: BigNumber; buying: Asset; price: BigNumber; selling: Asset }) {
  const { amount, buying, price, selling } = props
  return (
    <OperationDetails>
      {`Sell ${formatBalance(amount.toString())} ${selling.code} at ${formatBalance(price.toString())} ${buying.code}/${
        selling.code
      }`}
    </OperationDetails>
  )
}

interface ManageOfferOperationProps {
  accountData: ObservedAccountData
  operation: Operation.ManageOffer
  style?: React.CSSProperties
  testnet: boolean
}

function ManageOfferOperation(props: ManageOfferOperationProps) {
  const operation = props.operation
  const offers = useAccountOffers(props.accountData.id, props.testnet)

  if (operation.offerId === "0") {
    // Offer creation
    const amount = BigNumber(operation.amount)
    const price = BigNumber(operation.price)
    return (
      <ListItem
        heading={<OfferHeading {...operation} amount={amount} />}
        primaryText={<OfferDetails {...operation} amount={amount} price={price} />}
        style={props.style}
      />
    )
  } else if (Number.parseFloat(operation.amount as string) === 0) {
    // Offer deletion
    // Take care to cast to string before comparing IDs, since there are issues
    const offer = offers.offers.find(someOffer => String(someOffer.id) === String(operation.offerId))
    return offer ? (
      <ListItem
        heading={<OfferHeading {...offer} amount={BigNumber(0)} offerId={offer.id} />}
        primaryText={<OfferDetails {...offer} amount={BigNumber(offer.amount)} price={BigNumber(offer.price)} />}
        style={props.style}
      />
    ) : (
      <ListItem
        heading={<OfferHeading {...operation} amount={BigNumber(0)} offerId={operation.offerId} />}
        primaryText={
          <OfferDetails {...operation} amount={BigNumber(operation.amount)} price={BigNumber(operation.price)} />
        }
        style={props.style}
      />
    )
  } else {
    // Offer edit
    const offer = offers.offers.find(someOffer => someOffer.id === operation.offerId)
    return offer ? (
      <ListItem
        heading={<OfferHeading {...operation} amount={BigNumber(offer.amount)} />}
        primaryText={<OfferDetails {...offer} amount={BigNumber(offer.amount)} price={BigNumber(offer.price)} />}
        style={props.style}
      />
    ) : (
      <ListItem
        heading={<OfferHeading {...operation} amount={BigNumber(operation.amount)} />}
        primaryText={
          <OfferDetails {...operation} amount={BigNumber(operation.amount)} price={BigNumber(operation.price)} />
        }
        style={props.style}
      />
    )
  }
}

function SetOptionsOperation(props: { operation: Operation.SetOptions; style?: React.CSSProperties }) {
  let heading = <></>
  let primaryText = (
    <OperationDetails>
      <pre style={{ margin: "8px 0 0", fontFamily: "inherit", fontSize: "90%" }}>
        {prettifyOperationObject(props.operation)}
      </pre>
    </OperationDetails>
  )

  if (props.operation.signer && typeof props.operation.signer.weight === "number") {
    const signerPublicKey = String(props.operation.signer.ed25519PublicKey)
    if (props.operation.signer.weight > 0) {
      heading = <>Add signer</>
      primaryText = (
        <OperationDetails>
          <PublicKey publicKey={signerPublicKey} style={{ display: "block", fontWeight: "normal" }} variant="full" />
          <div>Key weight: {props.operation.signer.weight}</div>
        </OperationDetails>
      )
    } else if (props.operation.signer.weight === 0) {
      heading = <>Remove signer</>
      primaryText = (
        <OperationDetails>
          <PublicKey publicKey={signerPublicKey} style={{ fontWeight: "normal" }} variant="full" />
        </OperationDetails>
      )
    }
  } else if (someThresholdSet(props.operation)) {
    heading = <>Change key thresholds</>
    primaryText = (
      <OperationDetails>
        <pre style={{ margin: "8px 0 0", fontFamily: "inherit", fontSize: "90%" }}>
          {[
            `Low threshold:    ${props.operation.lowThreshold}`,
            `Medium threshold: ${props.operation.medThreshold}`,
            `High threshold:   ${props.operation.highThreshold}`
          ].join("\n")}
        </pre>
      </OperationDetails>
    )
  }
  return <ListItem heading={heading} primaryText={primaryText} style={props.style} />
}

function GenericOperation(props: { operation: TransactionOperation; style?: React.CSSProperties }) {
  return (
    <ListItem
      heading={<Typography>{formatOperation(props.operation)}</Typography>}
      primaryText={
        <OperationDetails>
          <pre style={{ margin: "8px 0 0", fontFamily: "inherit", fontSize: "90%" }}>
            {prettifyOperationObject(props.operation)}
          </pre>
        </OperationDetails>
      }
      style={props.style}
    />
  )
}

interface Props {
  accountData: ObservedAccountData
  operation: TransactionOperation
  style?: React.CSSProperties
  testnet: boolean
}

function OperationListItem(props: Props) {
  // TODO: Add more operation types!

  if (props.operation.type === "changeTrust") {
    return <ChangeTrustOperation operation={props.operation} style={props.style} />
  } else if (props.operation.type === "createAccount") {
    return <CreateAccountOperation operation={props.operation} style={props.style} />
  } else if (props.operation.type === "payment") {
    return <PaymentOperation operation={props.operation} style={props.style} />
  } else if (props.operation.type === "manageOffer") {
    return (
      <ManageOfferOperation
        accountData={props.accountData}
        operation={props.operation}
        style={props.style}
        testnet={props.testnet}
      />
    )
  } else if (props.operation.type === "setOptions") {
    return <SetOptionsOperation operation={props.operation} style={props.style} />
  } else {
    return <GenericOperation operation={props.operation} style={props.style} />
  }
}

export default OperationListItem
