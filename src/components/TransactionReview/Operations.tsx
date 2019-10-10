import BigNumber from "big.js"
import React from "react"
import { Asset, Operation, Transaction } from "stellar-sdk"
import { formatBalance, SingleBalance } from "../Account/AccountBalances"
import { useLiveAccountOffers, ObservedAccountData } from "../../hooks/stellar-subscriptions"
import { offerAssetToAsset, trustlineLimitEqualsUnlimited } from "../../lib/stellar"
import { CopyableAddress } from "../PublicKey"
import { SummaryItem, SummaryDetailsField } from "./SummaryItem"

const isUTF8 = (buffer: Buffer) => !buffer.toString("utf8").match(/[\x00-\x1F]/)

function someThresholdSet(operation: Operation.SetOptions) {
  return (
    typeof operation.lowThreshold === "number" ||
    typeof operation.medThreshold === "number" ||
    typeof operation.highThreshold === "number"
  )
}

function prettifyCamelcase(identifier: string) {
  const prettified = identifier.replace(/[A-Z]/g, letter => ` ${letter.toLowerCase()}`)
  return prettified.charAt(0).toUpperCase() + prettified.substr(1)
}

function prettifyOperationObject(operation: Operation) {
  const operationPropNames = Object.keys(operation)
    .filter(key => key !== "type")
    .filter(propName => Boolean((operation as any)[propName]))

  const operationDetailLines = operationPropNames.map(
    propName => `${prettifyCamelcase(propName)}: ${JSON.stringify((operation as any)[propName], null, 2)}`
  )
  return operationDetailLines.join("\n")
}

export function getOperationTitle(operation: Operation) {
  if (operation.type === "payment") {
    return "Payment"
  } else if (operation.type === "createAccount") {
    return "Create account"
  } else if (operation.type === "manageBuyOffer") {
    const amount = BigNumber(operation.buyAmount)
    const offerId = operation.offerId

    return offerId === "0" ? "Create buy offer" : amount.eq(0) ? "Delete buy offer" : "Update buy offer"
  } else if (operation.type === "manageSellOffer") {
    const amount = BigNumber(operation.amount)
    const offerId = operation.offerId

    return offerId === "0" ? "Create trade offer" : amount.eq(0) ? "Delete trade offer" : "Update trade offer"
  } else if (operation.type === "accountMerge") {
    return "Merge account"
  } else if (operation.type === "changeTrust") {
    return BigNumber(operation.limit).eq(0) ? "Remove asset" : "Add asset"
  } else if (operation.type === "manageData") {
    return "Set account data"
  } else if (operation.type === "setOptions" && operation.signer && typeof operation.signer.weight === "number") {
    return operation.signer.weight > 0 ? "Add signer" : "Remove signer"
  } else if (
    operation.type === "setOptions" &&
    operation.signer &&
    operation.signer.weight !== undefined &&
    operation.signer.weight > 0
  ) {
    return "Add signer"
  } else if (
    operation.type === "setOptions" &&
    operation.signer &&
    operation.signer.weight !== undefined &&
    operation.signer.weight === 0
  ) {
    return "Remove signer"
  } else if (operation.type === "setOptions" && someThresholdSet(operation)) {
    return "Change signature setup"
  } else if (operation.type === "setOptions" && operation.masterWeight !== undefined) {
    return "Set master key weight"
  } else if (operation.type === "setOptions" && operation.homeDomain) {
    return "Set home domain"
  } else if (operation.type === "setOptions" && operation.inflationDest) {
    return "Set inflation destination"
  } else if (operation.type === "setOptions") {
    return "Set account options"
  } else {
    return prettifyCamelcase(operation.type)
  }
}

function Pre(props: { children: React.ReactNode }) {
  return <pre style={{ width: "100%", overflow: "hidden", fontFamily: "inherit", fontSize: 14 }}>{props.children}</pre>
}

interface OperationProps<Op extends Operation> {
  operation: Op
  hideHeading?: boolean
  style?: React.CSSProperties
}

function PaymentOperation(props: OperationProps<Operation.Payment>) {
  const { amount, asset, destination, source } = props.operation
  return (
    <SummaryItem heading={props.hideHeading ? undefined : "Payment"}>
      <SummaryDetailsField
        label="Amount"
        value={<SingleBalance assetCode={asset.code} balance={String(amount)} untrimmed />}
      />
      <SummaryDetailsField label="Destination" value={<CopyableAddress address={destination} variant="short" />} />
      {source ? (
        <SummaryDetailsField label="Source" value={<CopyableAddress address={source} variant="short" />} />
      ) : null}
    </SummaryItem>
  )
}

function CreateAccountOperation(props: OperationProps<Operation.CreateAccount>) {
  const { startingBalance, destination, source } = props.operation
  return (
    <SummaryItem heading={props.hideHeading ? undefined : "Create account"}>
      <SummaryDetailsField
        label="Account to create"
        value={<CopyableAddress address={destination} variant="short" />}
      />
      <SummaryDetailsField
        label="Funding amount"
        value={<SingleBalance assetCode="XLM" balance={String(startingBalance)} untrimmed />}
      />
      {source ? (
        <SummaryDetailsField label="Funding account" value={<CopyableAddress address={source} variant="short" />} />
      ) : null}
    </SummaryItem>
  )
}

function ChangeTrustOperation(props: OperationProps<Operation.ChangeTrust>) {
  if (BigNumber(props.operation.limit).eq(0)) {
    return (
      <SummaryItem heading={props.hideHeading ? undefined : "Remove asset"}>
        <SummaryDetailsField label="Asset" value={props.operation.line.code} />
        <SummaryDetailsField
          label="Issued by"
          value={<CopyableAddress address={props.operation.line.issuer} variant="short" />}
        />
      </SummaryItem>
    )
  } else {
    return (
      <SummaryItem heading={props.hideHeading ? undefined : "Add asset"}>
        <SummaryDetailsField label="Asset" value={props.operation.line.code} />
        <SummaryDetailsField
          label="Issued by"
          value={<CopyableAddress address={props.operation.line.issuer} variant="short" />}
        />
        <SummaryDetailsField
          label="Limit"
          value={
            trustlineLimitEqualsUnlimited(props.operation.limit)
              ? "Unlimited"
              : `Limited to ${props.operation.limit} ${props.operation.line.code}`
          }
        />
      </SummaryItem>
    )
  }
}

export function OfferDetailsString(props: { amount: BigNumber; buying: Asset; price: BigNumber; selling: Asset }) {
  const { amount, buying, price, selling } = props
  return (
    `Buy ${formatBalance(amount.mul(price).toString())} ${buying.code} ` +
    `for ${formatBalance(amount.toString())} ${selling.code}`
  )
}

interface ManageDataOperationProps {
  hideHeading?: boolean
  operation: Operation.ManageData
  style?: React.CSSProperties
  testnet: boolean
  transaction: Transaction
}

function ManageDataOperation(props: ManageDataOperationProps) {
  return (
    <SummaryItem heading={props.hideHeading ? undefined : "Set account data"}>
      <SummaryDetailsField
        fullWidth
        label={props.operation.name}
        value={
          isUTF8(props.operation.value)
            ? props.operation.value.toString("utf8")
            : props.operation.value.toString("base64")
        }
      />
    </SummaryItem>
  )
}

interface ManageOfferOperationProps {
  accountData: ObservedAccountData
  hideHeading?: boolean
  operation: Operation.ManageSellOffer
  style?: React.CSSProperties
  testnet: boolean
}

function ManageOfferOperation(props: ManageOfferOperationProps) {
  const { buying, offerId, selling } = props.operation
  const amount = BigNumber(props.operation.amount)
  const price = BigNumber(props.operation.price)
  const offers = useLiveAccountOffers(props.accountData.id, props.testnet)

  if (offerId === "0") {
    // Offer creation
    return (
      <SummaryItem heading={props.hideHeading ? undefined : "Create trade offer"}>
        <SummaryDetailsField
          label="Sell"
          value={<SingleBalance assetCode={selling.code} balance={String(amount)} untrimmed />}
        />
        <SummaryDetailsField
          label="Buy"
          value={<SingleBalance assetCode={buying.code} balance={String(amount.mul(price))} untrimmed />}
        />
      </SummaryItem>
    )
  } else {
    // Offer edit
    const heading = amount.eq(0) ? "Delete trade offer" : "Update trade offer"
    const offer = offers.offers.find(someOffer => String(someOffer.id) === String(offerId))

    return offer ? (
      <SummaryItem heading={props.hideHeading ? undefined : heading}>
        <SummaryDetailsField
          label="Sell"
          value={<SingleBalance assetCode={offerAssetToAsset(offer.selling).getCode()} balance={offer.amount} />}
        />
        <SummaryDetailsField
          label="Buy"
          value={
            <SingleBalance
              assetCode={offerAssetToAsset(offer.buying).getCode()}
              balance={String(BigNumber(offer.amount).mul(offer.price))}
            />
          }
        />
      </SummaryItem>
    ) : (
      <SummaryItem heading={props.hideHeading ? undefined : heading}>
        <SummaryDetailsField label="Sell" value={<SingleBalance assetCode={selling.code} balance={String(amount)} />} />
        <SummaryDetailsField
          label="Buy"
          value={<SingleBalance assetCode={buying.code} balance={String(amount.mul(price))} />}
        />
      </SummaryItem>
    )
  }
}

interface SetOptionsOperationProps {
  hideHeading?: boolean
  operation: Operation.SetOptions
  style?: React.CSSProperties
  transaction: Transaction
}

function SetOptionsOperation(props: SetOptionsOperationProps) {
  if (
    props.operation.signer &&
    "ed25519PublicKey" in props.operation.signer &&
    typeof props.operation.signer.weight === "number"
  ) {
    const signerPublicKey = String(props.operation.signer.ed25519PublicKey)
    if (props.operation.signer.weight > 0) {
      return (
        <SummaryItem heading={props.hideHeading ? undefined : "Add signer"}>
          <SummaryDetailsField
            label="New signer"
            value={<CopyableAddress address={signerPublicKey} variant="short" />}
          />
          <SummaryDetailsField label="Key weight" value={props.operation.signer.weight} />
          <SummaryDetailsField
            label="Account to add signer to"
            value={<CopyableAddress address={props.operation.source || props.transaction.source} variant="short" />}
          />
        </SummaryItem>
      )
    } else if (props.operation.signer.weight === 0) {
      return (
        <SummaryItem heading={props.hideHeading ? undefined : "Remove signer"}>
          <SummaryDetailsField label="Signer" value={<CopyableAddress address={signerPublicKey} variant="short" />} />
          <SummaryDetailsField
            label="Account to remove signer from"
            value={<CopyableAddress address={props.operation.source || props.transaction.source} variant="short" />}
          />
        </SummaryItem>
      )
    }
  } else if (someThresholdSet(props.operation)) {
    const { highThreshold, lowThreshold, medThreshold } = props.operation

    return lowThreshold === medThreshold && medThreshold === highThreshold ? (
      <SummaryItem heading={props.hideHeading ? undefined : "Change signature setup"}>
        <SummaryDetailsField fullWidth label="Required signatures" value={props.operation.lowThreshold} />
      </SummaryItem>
    ) : (
      <SummaryItem heading={props.hideHeading ? undefined : "Change signature setup"}>
        <SummaryDetailsField
          fullWidth
          label="New key thresholds"
          value={
            <Pre>
              {[
                `Low threshold:    ${props.operation.lowThreshold}`,
                `Medium threshold: ${props.operation.medThreshold}`,
                `High threshold:   ${props.operation.highThreshold}`
              ].join("\n")}
            </Pre>
          }
        />
      </SummaryItem>
    )
  } else if (props.operation.inflationDest) {
    return (
      <SummaryItem heading={props.hideHeading ? undefined : "Set inflation destination"}>
        <SummaryDetailsField
          fullWidth
          label="New destination"
          value={<CopyableAddress address={props.operation.inflationDest} variant="short" />}
        />
      </SummaryItem>
    )
  }

  return (
    <SummaryItem>
      <SummaryDetailsField
        fullWidth
        label="Set account options"
        value={<Pre>{prettifyOperationObject(props.operation)}</Pre>}
      />
    </SummaryItem>
  )
}

function AccountMergeOperation(props: OperationProps<Operation.AccountMerge>) {
  const { destination, source } = props.operation
  return (
    <SummaryItem heading={props.hideHeading ? undefined : "Merge account"}>
      {source ? (
        <SummaryDetailsField label="Account" value={<CopyableAddress address={source} variant="short" />} />
      ) : null}
      <SummaryDetailsField label="Merge into" value={<CopyableAddress address={destination} variant="short" />} />
    </SummaryItem>
  )
}

function GenericOperation(props: { operation: Operation; style?: React.CSSProperties }) {
  return (
    <SummaryItem>
      <SummaryDetailsField
        fullWidth
        label={getOperationTitle(props.operation)}
        value={<Pre>{prettifyOperationObject(props.operation)}</Pre>}
      />
    </SummaryItem>
  )
}

interface Props {
  accountData: ObservedAccountData
  operation: Operation
  style?: React.CSSProperties
  testnet: boolean
  transaction: Transaction
}

function OperationListItem(props: Props) {
  const hideHeading = props.transaction.operations.length === 1

  if (props.operation.type === "changeTrust") {
    return <ChangeTrustOperation hideHeading={hideHeading} operation={props.operation} style={props.style} />
  } else if (props.operation.type === "createAccount") {
    return <CreateAccountOperation hideHeading={hideHeading} operation={props.operation} style={props.style} />
  } else if (props.operation.type === "payment") {
    return <PaymentOperation hideHeading={hideHeading} operation={props.operation} style={props.style} />
  } else if (props.operation.type === "manageData") {
    return (
      <ManageDataOperation
        hideHeading={hideHeading}
        operation={props.operation}
        style={props.style}
        testnet={props.testnet}
        transaction={props.transaction}
      />
    )
  } else if (props.operation.type === "manageSellOffer") {
    return (
      <ManageOfferOperation
        accountData={props.accountData}
        hideHeading={hideHeading}
        operation={props.operation}
        style={props.style}
        testnet={props.testnet}
      />
    )
  } else if (props.operation.type === "setOptions") {
    return (
      <SetOptionsOperation
        hideHeading={hideHeading}
        operation={props.operation}
        style={props.style}
        transaction={props.transaction}
      />
    )
  } else if (props.operation.type === "accountMerge") {
    return <AccountMergeOperation hideHeading={hideHeading} operation={props.operation} style={props.style} />
  } else {
    return <GenericOperation operation={props.operation} style={props.style} />
  }
}

export default React.memo(OperationListItem)
