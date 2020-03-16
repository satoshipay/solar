import BigNumber from "big.js"
import { TFunction } from "i18next"
import React from "react"
import { useTranslation } from "react-i18next"
import { Asset, Operation, Transaction } from "stellar-sdk"
import { formatBalance, SingleBalance } from "../Account/AccountBalances"
import { useLiveAccountOffers } from "../../hooks/stellar-subscriptions"
import { useAccountHomeDomainSafe } from "../../hooks/stellar"
import { useIsSmallMobile } from "../../hooks/userinterface"
import { AccountData } from "../../lib/account"
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

export function useOperationTitle() {
  const { t } = useTranslation()
  return function getOperationTitle(operation: Operation) {
    if (operation.type === "payment") {
      return t("operations.payment.title")
    } else if (operation.type === "createAccount") {
      return t("operations.create-account.title")
    } else if (operation.type === "manageBuyOffer") {
      const amount = BigNumber(operation.buyAmount)
      const offerId = operation.offerId

      return offerId === "0"
        ? t("operations.manage-buy-offer.title.create")
        : amount.eq(0)
        ? t("operations.manage-buy-offer.title.delete")
        : t("operations.manage-buy-offer.title.update")
    } else if (operation.type === "manageSellOffer") {
      const amount = BigNumber(operation.amount)
      const offerId = operation.offerId

      return offerId === "0"
        ? t("operations.manage-sell-offer.title.create")
        : amount.eq(0)
        ? t("operations.manage-sell-offer.title.delete")
        : t("operations.manage-sell-offer.title.update")
    } else if (operation.type === "accountMerge") {
      return t("operations.account-merge.title")
    } else if (operation.type === "changeTrust") {
      return BigNumber(operation.limit).eq(0)
        ? t("operations.change-trust.title.remove-asset")
        : t("operations.change-trust.title.add-asset")
    } else if (operation.type === "manageData") {
      return t("operations.manage-data.title")
    } else if (operation.type === "setOptions" && operation.signer && typeof operation.signer.weight === "number") {
      return operation.signer.weight > 0
        ? t("operations.set-options.add-signer.title")
        : t("operations.set-options.remove-signer.title")
    } else if (
      operation.type === "setOptions" &&
      operation.signer &&
      operation.signer.weight !== undefined &&
      operation.signer.weight > 0
    ) {
      return t("operations.set-options.add-signer.title")
    } else if (
      operation.type === "setOptions" &&
      operation.signer &&
      operation.signer.weight !== undefined &&
      operation.signer.weight === 0
    ) {
      return t("operations.set-options.remove-signer.title")
    } else if (operation.type === "setOptions" && someThresholdSet(operation)) {
      return t("operations.set-options.change-signature-setup.title")
    } else if (operation.type === "setOptions" && operation.masterWeight !== undefined) {
      return t("operations.set-options.set-master-key-weight.title")
    } else if (operation.type === "setOptions" && operation.homeDomain) {
      return t("operations.set-options.set-home-domain.title")
    } else if (operation.type === "setOptions" && operation.inflationDest) {
      return t("operations.set-options.set-inflation-destination.title")
    } else if (operation.type === "setOptions") {
      return t("operations.set-options.set-account-options.title")
    } else {
      return prettifyCamelcase(operation.type)
    }
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
  const { t } = useTranslation()
  return (
    <SummaryItem heading={props.hideHeading ? undefined : t("operations.payment.title")}>
      <SummaryDetailsField
        label={t("operations.payment.summary.amount")}
        value={<SingleBalance assetCode={asset.code} balance={String(amount)} untrimmed />}
      />
      <SummaryDetailsField
        label={t("operations.payment.summary.destination")}
        value={<CopyableAddress address={destination} variant="short" />}
      />
      {source ? (
        <SummaryDetailsField
          label={t("operations.payment.summary.source")}
          value={<CopyableAddress address={source} variant="short" />}
        />
      ) : null}
    </SummaryItem>
  )
}

function CreateAccountOperation(props: OperationProps<Operation.CreateAccount>) {
  const { startingBalance, destination, source } = props.operation
  const { t } = useTranslation()
  return (
    <SummaryItem heading={props.hideHeading ? undefined : t("operations.create-account.title")}>
      <SummaryDetailsField
        label={t("operations.create-account.summary.account")}
        value={<CopyableAddress address={destination} variant="short" />}
      />
      <SummaryDetailsField
        label={t("operations.create-account.summary.funding-amount")}
        value={<SingleBalance assetCode="XLM" balance={String(startingBalance)} untrimmed />}
      />
      {source ? (
        <SummaryDetailsField
          label={t("operations.create-account.summary.funding-account")}
          value={<CopyableAddress address={source} variant="short" />}
        />
      ) : null}
    </SummaryItem>
  )
}

function ChangeTrustOperation(props: OperationProps<Operation.ChangeTrust> & { testnet: boolean }) {
  const { t } = useTranslation()
  const homeDomain = useAccountHomeDomainSafe(props.operation.line.issuer, props.testnet)

  if (BigNumber(props.operation.limit).eq(0)) {
    return (
      <SummaryItem heading={props.hideHeading ? undefined : t("operations.change-trust.title.remove-asset")}>
        <SummaryDetailsField label={t("operations.change-trust.summary.asset")} value={props.operation.line.code} />
        <SummaryDetailsField
          label={t("operations.change-trust.summary.issued-by")}
          value={<CopyableAddress address={homeDomain || props.operation.line.issuer} variant="short" />}
        />
      </SummaryItem>
    )
  } else {
    return (
      <SummaryItem heading={props.hideHeading ? undefined : t("operations.change-trust.title.add-asset")}>
        <SummaryDetailsField label="Asset" value={props.operation.line.code} />
        <SummaryDetailsField
          label={t("operations.change-trust.summary.issued-by")}
          value={<CopyableAddress address={homeDomain || props.operation.line.issuer} variant="short" />}
        />
        {BigNumber(props.operation.limit).gt(900000000000) ? null : (
          <SummaryDetailsField
            label={t("operations.change-trust.summary.limit.label")}
            value={
              trustlineLimitEqualsUnlimited(props.operation.limit)
                ? t("operations.change-trust.summary.limit.value.unlimited")
                : t("operations.change-trust.summary.limit.value.limited-to", {
                    limit: props.operation.limit,
                    code: props.operation.line.code
                  })
            }
          />
        )}
      </SummaryItem>
    )
  }
}

export function OfferDetailsString(
  props: { amount: BigNumber; buying: Asset; price: BigNumber; selling: Asset },
  t: TFunction
) {
  const { amount, buying, price, selling } = props

  return t("operations.offer-details.string", {
    amount: formatBalance(amount.toString()),
    buyingCode: buying.code,
    sellingCode: selling.code,
    price: formatBalance(amount.mul(price).toString())
  })
}

interface ManageDataOperationProps {
  hideHeading?: boolean
  operation: Operation.ManageData
  style?: React.CSSProperties
  testnet: boolean
  transaction: Transaction
}

function ManageDataOperation(props: ManageDataOperationProps) {
  const { t } = useTranslation()
  return (
    <SummaryItem heading={props.hideHeading ? undefined : t("operations.manage-data.title")}>
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
  accountData: AccountData
  hideHeading?: boolean
  operation: Operation.ManageBuyOffer | Operation.ManageSellOffer
  style?: React.CSSProperties
  testnet: boolean
}

function ManageOfferOperation(props: ManageOfferOperationProps) {
  const { buying, offerId, selling } = props.operation
  const isTinyScreen = useIsSmallMobile()
  const { t } = useTranslation()

  // props.operation.price is for both operations denoted in 1 unit of selling in terms of buying

  const buyAmount =
    props.operation.type === "manageBuyOffer"
      ? BigNumber(props.operation.buyAmount)
      : BigNumber(props.operation.amount).mul(props.operation.price)
  const sellAmount =
    props.operation.type === "manageBuyOffer"
      ? BigNumber(props.operation.buyAmount).mul(props.operation.price)
      : BigNumber(props.operation.amount)

  const offers = useLiveAccountOffers(props.accountData.id, props.testnet)

  if (offerId === "0") {
    // Offer creation
    return props.operation.type === "manageBuyOffer" ? (
      <SummaryItem heading={props.hideHeading ? undefined : t("operations.manage-buy-offer.title.create")}>
        <SummaryDetailsField
          fullWidth={isTinyScreen}
          label={t("operations.manage-offer.summary.buy")}
          value={<SingleBalance assetCode={buying.code} balance={String(buyAmount)} untrimmed />}
        />
        <SummaryDetailsField
          fullWidth={isTinyScreen}
          label={t("operations.manage-offer.summary.sell")}
          value={<SingleBalance assetCode={selling.code} balance={String(sellAmount)} untrimmed />}
        />
      </SummaryItem>
    ) : (
      <SummaryItem heading={props.hideHeading ? undefined : t("operations.manage-sell-offer.title.create")}>
        <SummaryDetailsField
          fullWidth={isTinyScreen}
          label={t("operations.manage-offer.summary.sell")}
          value={<SingleBalance assetCode={selling.code} balance={String(sellAmount)} untrimmed />}
        />
        <SummaryDetailsField
          fullWidth={isTinyScreen}
          label={t("operations.manage-offer.summary.buy")}
          value={<SingleBalance assetCode={buying.code} balance={String(buyAmount)} untrimmed />}
        />
      </SummaryItem>
    )
  } else {
    // Offer edit
    const offer = offers.find(someOffer => String(someOffer.id) === String(offerId))
    const heading =
      props.operation.type === "manageBuyOffer"
        ? buyAmount.eq(0)
          ? t("operations.manage-buy-offer.title.delete")
          : t("operations.manage-buy-offer.title.update")
        : buyAmount.eq(0)
        ? t("operations.manage-sell-offer.title.delete")
        : t("operations.manage-sell-offer.title.update")

    return offer ? (
      <SummaryItem heading={props.hideHeading ? undefined : heading}>
        <SummaryDetailsField
          label={t("operations.manage-offer.summary.sell")}
          value={<SingleBalance assetCode={offerAssetToAsset(offer.selling).getCode()} balance={offer.amount} />}
        />
        <SummaryDetailsField
          label={t("operations.manage-offer.summary.buy")}
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
        <SummaryDetailsField
          label={t("operations.manage-offer.summary.sell")}
          value={<SingleBalance assetCode={selling.code} balance={String(sellAmount)} />}
        />
        <SummaryDetailsField
          label={t("operations.manage-offer.summary.buy")}
          value={<SingleBalance assetCode={buying.code} balance={String(buyAmount)} />}
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
  const { t } = useTranslation()
  if (
    props.operation.signer &&
    "ed25519PublicKey" in props.operation.signer &&
    typeof props.operation.signer.weight === "number"
  ) {
    const signerPublicKey = String(props.operation.signer.ed25519PublicKey)
    if (props.operation.signer.weight > 0) {
      return (
        <SummaryItem heading={props.hideHeading ? undefined : t("operations.set-options.add-signer.title")}>
          <SummaryDetailsField
            label={t("operations.set-options.add-signer.summary.new-signer")}
            value={<CopyableAddress address={signerPublicKey} variant="short" />}
          />
          <SummaryDetailsField
            label={t("operations.set-options.add-signer.summary.key-weight")}
            value={props.operation.signer.weight}
          />
          <SummaryDetailsField
            label={t("operations.set-options.add-signer.summary.account")}
            value={<CopyableAddress address={props.operation.source || props.transaction.source} variant="short" />}
          />
        </SummaryItem>
      )
    } else if (props.operation.signer.weight === 0) {
      return (
        <SummaryItem heading={props.hideHeading ? undefined : t("operations.payment.set-options.remove-signer.title")}>
          <SummaryDetailsField
            label={t("operations.set-options.remove-signer.summary.signer")}
            value={<CopyableAddress address={signerPublicKey} variant="short" />}
          />
          <SummaryDetailsField
            label={t("operations.set-options.remove-signer.summary.account")}
            value={<CopyableAddress address={props.operation.source || props.transaction.source} variant="short" />}
          />
        </SummaryItem>
      )
    }
  } else if (someThresholdSet(props.operation)) {
    const { highThreshold, lowThreshold, medThreshold } = props.operation

    return lowThreshold === medThreshold && medThreshold === highThreshold ? (
      <SummaryItem heading={props.hideHeading ? undefined : t("operations.set-options.change-signature-setup.title")}>
        <SummaryDetailsField
          fullWidth
          label={t("operations.set-options.change-signature-setup.summary.required-signatures")}
          value={props.operation.lowThreshold}
        />
      </SummaryItem>
    ) : (
      <SummaryItem heading={props.hideHeading ? undefined : t("operations.set-options.change-signature-setup.title")}>
        <SummaryDetailsField
          fullWidth
          label={t("operations.set-options.change-signature-setup.summary..key-thresholds.label")}
          value={
            <Pre>
              {[
                t("operations.set-options.change-signature-setup.summary.key-thresholds.value.low", {
                  threshold: props.operation.lowThreshold
                }),
                t("operations.set-options.change-signature-setup.summary.key-thresholds.value.medium", {
                  threshold: props.operation.medThreshold
                }),
                t("operations.set-options.change-signature-setup.summary.key-thresholds.value.high", {
                  threshold: props.operation.highThreshold
                })
              ].join("\n")}
            </Pre>
          }
        />
      </SummaryItem>
    )
  } else if (props.operation.inflationDest) {
    return (
      <SummaryItem
        heading={props.hideHeading ? undefined : t("operations.set-options.set-inflation-destination.title")}
      >
        <SummaryDetailsField
          fullWidth
          label={t("operations.set-options.set-inflation-destination.summary.new-destination")}
          value={<CopyableAddress address={props.operation.inflationDest} variant="short" />}
        />
      </SummaryItem>
    )
  }

  return (
    <SummaryItem>
      <SummaryDetailsField
        fullWidth
        label={t("operations.set-options.set-account-options.title")}
        value={<Pre>{prettifyOperationObject(props.operation)}</Pre>}
      />
    </SummaryItem>
  )
}

function AccountMergeOperation(props: OperationProps<Operation.AccountMerge>) {
  const { destination, source } = props.operation
  const { t } = useTranslation()
  return (
    <SummaryItem heading={props.hideHeading ? undefined : t("operations.account-merge.title")}>
      {source ? (
        <SummaryDetailsField
          label={t("operations.account-merge.summary.account")}
          value={<CopyableAddress address={source} variant="short" />}
        />
      ) : null}
      <SummaryDetailsField
        label={t("operations.account-merge.summary.merge-into")}
        value={<CopyableAddress address={destination} variant="short" />}
      />
    </SummaryItem>
  )
}

function GenericOperation(props: { operation: Operation; style?: React.CSSProperties }) {
  const getOperationTitle = useOperationTitle()
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
  accountData: AccountData
  operation: Operation
  style?: React.CSSProperties
  testnet: boolean
  transaction: Transaction
}

function OperationListItem(props: Props) {
  const hideHeading = props.transaction.operations.length === 1

  if (props.operation.type === "changeTrust") {
    return (
      <ChangeTrustOperation
        hideHeading={hideHeading}
        operation={props.operation}
        style={props.style}
        testnet={props.testnet}
      />
    )
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
  } else if (props.operation.type === "manageBuyOffer" || props.operation.type === "manageSellOffer") {
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
