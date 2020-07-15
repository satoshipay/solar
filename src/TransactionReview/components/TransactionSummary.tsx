import BigNumber from "big.js"
import React from "react"
import { useTranslation } from "react-i18next"
import { Operation, Transaction } from "stellar-sdk"
import Collapse from "@material-ui/core/Collapse"
import Divider from "@material-ui/core/Divider"
import useMediaQuery from "@material-ui/core/useMediaQuery"
import { useTheme } from "@material-ui/core/styles"
import { Account, AccountsContext } from "~App/contexts/accounts"
import { SigningKeyCacheContext } from "~App/contexts/caches"
import { useLiveAccountDataSet } from "~Generic/hooks/stellar-subscriptions"
import { useDeferredState } from "~Generic/hooks/util"
import { AccountData } from "~Generic/lib/account"
import { MultisigTransactionResponse } from "~Generic/lib/multisig-service"
import { getAllSources } from "~Generic/lib/stellar"
import { isPotentiallyDangerousTransaction, isStellarWebAuthTransaction } from "~Generic/lib/transaction"
import { SingleBalance } from "~Account/components/AccountBalances"
import { AccountName } from "~Generic/components/Fetchers"
import { VerticalLayout } from "~Layout/components/Box"
import { ClickableAddress, CopyableAddress } from "~Generic/components/PublicKey"
import { ShowMoreItem, SummaryDetailsField, SummaryItem } from "./SummaryItem"
import OperationListItem from "./Operations"
import { Signers, TransactionMemo } from "./Transaction"
import { AccountCreationWarning, AddingSignerWarning, DangerousTransactionWarning } from "./Warnings"

type TransactionWithUndocumentedProps = Transaction & {
  created_at: string
}

function getTime(time: string | number) {
  const date = new Date(time)
  return date.toLocaleString()
}

function makeOperationSourceExplicit(
  operation: Operation,
  transaction: Transaction,
  localAccountPubKey?: string
): Operation {
  const effectiveSource = operation.source || transaction.source

  // Don't show the source if the source === the tx source === this account (this is the default case)
  return effectiveSource === transaction.source && (effectiveSource === localAccountPubKey || !localAccountPubKey)
    ? operation
    : { ...operation, source: effectiveSource }
}

const noHPaddingStyle = {
  paddingLeft: 0,
  paddingRight: 0
}

interface DefaultTransactionSummaryProps {
  account: Account | null
  accountData: AccountData
  canSubmit: boolean
  isDangerousSignatureRequest?: boolean
  showHash?: boolean
  showSigners?: boolean
  showSource?: boolean
  signatureRequest?: MultisigTransactionResponse
  testnet: boolean
  transaction: Transaction
}

function DefaultTransactionSummary(props: DefaultTransactionSummaryProps) {
  const { accounts } = React.useContext(AccountsContext)
  const { t } = useTranslation()
  const theme = useTheme()

  const [showingAllMetadataDeferred, showingAllMetadata, setShowingAllMetadata] = useDeferredState(
    false,
    theme.transitions.duration.shortest
  )

  const localAccountPublicKey = props.account ? props.account.publicKey : undefined
  const showAllMetadata = React.useCallback(() => setShowingAllMetadata(true), [setShowingAllMetadata])

  const fee = BigNumber(props.transaction.fee)
    .mul(props.transaction.operations.length)
    .div(1e7)

  const isDangerousSignatureRequest = React.useMemo(() => {
    const trustedKeys = accounts.reduce<string[]>(
      (trusted, account) =>
        account.accountID !== account.publicKey
          ? [...trusted, account.accountID, account.publicKey]
          : [...trusted, account.accountID],
      []
    )
    return (
      props.signatureRequest &&
      isPotentiallyDangerousTransaction(props.transaction, props.signatureRequest.signed_by, trustedKeys)
    )
  }, [accounts, props.signatureRequest, props.transaction])

  const isAccountCreation = props.transaction.operations.some(op => op.type === "createAccount")
  const isAddingSigner = props.transaction.operations.some(
    op => op.type === "setOptions" && (op.signer?.weight || 0) > 0
  )

  const isWideScreen = useMediaQuery("(min-width:900px)")
  const widthStyling = isWideScreen ? { maxWidth: 700, minWidth: 400 } : { minWidth: "66vw" }

  const transaction = props.transaction as TransactionWithUndocumentedProps
  const transactionHash = React.useMemo(() => {
    return transaction.hash().toString("hex")
  }, [transaction])

  return (
    <VerticalLayout style={widthStyling}>
      {isDangerousSignatureRequest ? <DangerousTransactionWarning /> : null}
      {isAccountCreation && props.canSubmit ? <AccountCreationWarning /> : null}
      {isAddingSigner && props.canSubmit ? <AddingSignerWarning /> : null}
      {props.transaction.operations.map((operation, index) => (
        <OperationListItem
          key={index}
          accountData={props.accountData}
          operation={
            props.showSource
              ? makeOperationSourceExplicit(operation, props.transaction, localAccountPublicKey)
              : operation
          }
          style={noHPaddingStyle}
          testnet={props.testnet}
          transaction={props.transaction}
        />
      ))}
      <Divider style={{ marginTop: 11, marginBottom: 11 }} />
      <TransactionMemo memo={props.transaction.memo} style={noHPaddingStyle} />
      {props.showSigners ? (
        <Signers
          accounts={accounts}
          accountData={props.accountData}
          signatureRequest={props.signatureRequest}
          style={noHPaddingStyle}
          transaction={props.transaction}
        />
      ) : null}
      <Collapse in={!showingAllMetadata}>
        <ShowMoreItem onClick={showAllMetadata} />
      </Collapse>
      <Collapse in={showingAllMetadataDeferred}>
        <VerticalLayout grow>
          {props.showSource ? (
            <SummaryItem>
              <SummaryDetailsField
                fullWidth
                label={t("account.transaction-review.summary.item.account.label")}
                value={<CopyableAddress address={props.transaction.source} testnet={props.testnet} variant="short" />}
              />
            </SummaryItem>
          ) : null}
          {props.showHash ? (
            <SummaryItem>
              <SummaryDetailsField
                fullWidth
                label={t("account.transaction-review.summary.item.tx-hash.label")}
                value={<ClickableAddress address={transactionHash} testnet={props.testnet} variant="shorter" />}
              />
            </SummaryItem>
          ) : null}
          <SummaryItem>
            <SummaryDetailsField
              label={t("account.transaction-review.summary.item.max-fee.label")}
              value={<SingleBalance assetCode="XLM" balance={fee.toString()} inline />}
            />
            {transaction.created_at ? (
              <SummaryDetailsField
                fullWidth
                label={t("account.transaction-review.summary.item.submission.label")}
                value={getTime(transaction.created_at)}
              />
            ) : null}
          </SummaryItem>
        </VerticalLayout>
      </Collapse>
    </VerticalLayout>
  )
}

interface WebAuthTransactionSummaryProps {
  style?: React.CSSProperties
  testnet: boolean
  transaction: Transaction
}

function WebAuthTransactionSummary(props: WebAuthTransactionSummaryProps) {
  const signingKeyCache = React.useContext(SigningKeyCacheContext).cache
  const { t } = useTranslation()
  const { timeBounds } = props.transaction

  const domain = signingKeyCache.get(props.transaction.source)
  const manageDataOperation = props.transaction.operations.find(op => op.type === "manageData")
  const maxTime = timeBounds ? Math.round(Number.parseInt(timeBounds.maxTime, 10) * 1000) : 0

  if (!manageDataOperation) {
    throw Error(t("account.transaction-review.validation.no-manage-data-operation"))
  }

  return (
    <VerticalLayout>
      <SummaryItem>
        <SummaryDetailsField
          label={t("account.transaction-review.summary.item.service.label")}
          value={domain ? domain : <AccountName publicKey={props.transaction.source} testnet={props.testnet} />}
        />
        <SummaryDetailsField
          label={t("account.transaction-review.summary.item.authenticating-account.label")}
          value={<CopyableAddress address={manageDataOperation.source || ""} testnet={props.testnet} variant="short" />}
        />
      </SummaryItem>
      {maxTime ? (
        <SummaryItem>
          <SummaryDetailsField
            label={t("account.transaction-review.summary.item.expiry.label")}
            value={getTime(maxTime)}
          />
        </SummaryItem>
      ) : null}
    </VerticalLayout>
  )
}

interface TransactionSummaryProps {
  account: Account | null
  canSubmit: boolean
  showHash?: boolean
  showSource?: boolean
  signatureRequest?: MultisigTransactionResponse
  testnet: boolean
  transaction: Transaction
}

function TransactionSummary(props: TransactionSummaryProps) {
  const allTxSources = getAllSources(props.transaction)
  const { accounts } = React.useContext(AccountsContext)
  const accountDataSet = useLiveAccountDataSet(allTxSources, props.testnet)
  const { t } = useTranslation()

  const accountData = accountDataSet.find(someAccountData => someAccountData.id === props.transaction.source)
  const showSigners = accountDataSet.some(someAccountData => someAccountData.signers.length > 1)

  if (!accountData) {
    throw new Error(t("account.transaction-review.validation.no-account-data"))
  }

  const isDangerousSignatureRequest = React.useMemo(() => {
    const trustedKeys = accounts.reduce<string[]>(
      (trusted, account) =>
        account.accountID !== account.publicKey
          ? [...trusted, account.accountID, account.publicKey]
          : [...trusted, account.accountID],
      []
    )
    return (
      props.signatureRequest &&
      isPotentiallyDangerousTransaction(props.transaction, props.signatureRequest.signed_by, trustedKeys)
    )
  }, [accounts, props.signatureRequest, props.transaction])

  const wideScreen = useMediaQuery("(min-width:900px)")
  const widthStyling = wideScreen ? { maxWidth: 700, minWidth: 320 } : { minWidth: "66vw" }

  if (isStellarWebAuthTransaction(props.transaction)) {
    return <WebAuthTransactionSummary style={widthStyling} testnet={props.testnet} transaction={props.transaction} />
  } else {
    return (
      <DefaultTransactionSummary
        {...props}
        accountData={accountData}
        isDangerousSignatureRequest={isDangerousSignatureRequest}
        showHash={props.showHash}
        showSigners={showSigners}
      />
    )
  }
}

export default React.memo(TransactionSummary)
