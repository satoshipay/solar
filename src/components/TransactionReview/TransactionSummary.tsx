import BigNumber from "big.js"
import React from "react"
import { Operation, Transaction } from "stellar-sdk"
import Collapse from "@material-ui/core/Collapse"
import Divider from "@material-ui/core/Divider"
import Grow from "@material-ui/core/Grow"
import List from "@material-ui/core/List"
import useMediaQuery from "@material-ui/core/useMediaQuery"
import { useLiveAccountDataSet } from "../../hooks/stellar-subscriptions"
import { Account, AccountsContext } from "../../context/accounts"
import { SigningKeyCacheContext } from "../../context/caches"
import { AccountData } from "../../lib/account"
import { SignatureRequest } from "../../lib/multisig-service"
import { getAllSources } from "../../lib/stellar"
import { isPotentiallyDangerousTransaction, isStellarWebAuthTransaction } from "../../lib/transaction"
import { SingleBalance } from "../Account/AccountBalances"
import { AccountName } from "../Fetchers"
import { VerticalLayout } from "../Layout/Box"
import { ClickableAddress, CopyableAddress } from "../PublicKey"
import { ShowMoreItem, SummaryDetailsField, SummaryItem } from "./SummaryItem"
import OperationListItem from "./Operations"
import { AccountCreationWarning, DangerousTransactionWarning, Signers, TransactionMemo } from "./Transaction"

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
  signatureRequest?: SignatureRequest
  testnet: boolean
  transaction: Transaction
}

function DefaultTransactionSummary(props: DefaultTransactionSummaryProps) {
  const allTxSources = getAllSources(props.transaction)
  const { accounts } = React.useContext(AccountsContext)
  const [showingAllMetadata, setShowingAllMetadata] = React.useState(props.canSubmit)
  const accountDataSet = useLiveAccountDataSet(allTxSources, props.testnet)

  const localAccountPublicKey = props.account ? props.account.publicKey : undefined
  const showAllMetadata = React.useCallback(() => setShowingAllMetadata(true), [])

  const fee = BigNumber(props.transaction.fee)
    .mul(props.transaction.operations.length)
    .div(1e7)

  const isDangerousSignatureRequest = React.useMemo(() => {
    const localAccounts = accountDataSet.filter(someAccountData =>
      accounts.some(account => account.publicKey === someAccountData.id)
    )
    return props.signatureRequest && isPotentiallyDangerousTransaction(props.transaction, localAccounts)
  }, [accountDataSet, accounts, props.signatureRequest, props.transaction])

  const isAccountCreation = props.transaction.operations.some(op => op.type === "createAccount")

  const isWideScreen = useMediaQuery("(min-width:900px)")
  const widthStyling = isWideScreen ? { maxWidth: 700, minWidth: 400 } : { minWidth: "66vw" }

  const transaction = props.transaction as TransactionWithUndocumentedProps
  const transactionHash = React.useMemo(() => {
    return transaction.hash().toString("hex")
  }, [transaction])

  return (
    <List disablePadding style={widthStyling}>
      {isDangerousSignatureRequest ? <DangerousTransactionWarning /> : null}
      {isAccountCreation ? <AccountCreationWarning /> : null}
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
          transaction={props.transaction}
          style={noHPaddingStyle}
        />
      ) : null}
      <Grow in={!showingAllMetadata}>
        <ShowMoreItem onClick={showAllMetadata} style={{ position: "absolute", width: "100%" }} />
      </Grow>
      <Collapse in={showingAllMetadata}>
        <VerticalLayout grow>
          {props.showSource ? (
            <SummaryItem>
              <SummaryDetailsField
                fullWidth
                label="Account"
                value={<CopyableAddress address={props.transaction.source} variant="short" />}
              />
            </SummaryItem>
          ) : null}
          {props.showHash ? (
            <SummaryItem>
              <SummaryDetailsField
                fullWidth
                label="Transaction Hash"
                value={<ClickableAddress address={transactionHash} variant="shorter" />}
              />
            </SummaryItem>
          ) : null}
          <SummaryItem>
            <SummaryDetailsField
              label="Maximum fee"
              value={<SingleBalance assetCode="XLM" balance={fee.toString()} inline />}
            />
            {transaction.created_at ? (
              <SummaryDetailsField fullWidth label="Submission" value={getTime(transaction.created_at)} />
            ) : null}
          </SummaryItem>
        </VerticalLayout>
      </Collapse>
    </List>
  )
}

interface WebAuthTransactionSummaryProps {
  style?: React.CSSProperties
  testnet: boolean
  transaction: Transaction
}

function WebAuthTransactionSummary(props: WebAuthTransactionSummaryProps) {
  const signingKeyCache = React.useContext(SigningKeyCacheContext).cache
  const { timeBounds } = props.transaction

  const domain = signingKeyCache.get(props.transaction.source)
  const manageDataOperation = props.transaction.operations.find(op => op.type === "manageData")
  const maxTime = timeBounds ? Math.round(Number.parseInt(timeBounds.maxTime, 10) * 1000) : 0

  if (!manageDataOperation) {
    throw Error("Invariant violation: Stellar web auth transaction must contain a manage_data operation.")
  }

  return (
    <List disablePadding style={props.style}>
      <SummaryItem>
        <SummaryDetailsField
          label="Service"
          value={domain ? domain : <AccountName publicKey={props.transaction.source} testnet={props.testnet} />}
        />
        <SummaryDetailsField
          label="Authenticating Account"
          value={<CopyableAddress address={manageDataOperation.source || ""} variant="short" />}
        />
      </SummaryItem>
      <Divider />
      {maxTime ? (
        <SummaryItem>
          <SummaryDetailsField label="Expiry" value={getTime(maxTime)} />
        </SummaryItem>
      ) : null}
    </List>
  )
}

interface TransactionSummaryProps {
  account: Account | null
  canSubmit: boolean
  showHash?: boolean
  showSource?: boolean
  signatureRequest?: SignatureRequest
  testnet: boolean
  transaction: Transaction
}

function TransactionSummary(props: TransactionSummaryProps) {
  const allTxSources = getAllSources(props.transaction)
  const { accounts } = React.useContext(AccountsContext)
  const accountDataSet = useLiveAccountDataSet(allTxSources, props.testnet)

  const accountData = accountDataSet.find(someAccountData => someAccountData.id === props.transaction.source)
  const showSigners = accountDataSet.some(someAccountData => someAccountData.signers.length > 1)

  if (!accountData) {
    throw new Error(
      "Invariant violation: " +
        "Cannot find the transaction source account's account data in set of account data subscriptions."
    )
  }

  const isDangerousSignatureRequest = React.useMemo(() => {
    const localAccounts = accountDataSet.filter(someAccountData =>
      accounts.some(account => account.publicKey === someAccountData.id)
    )
    return props.signatureRequest && isPotentiallyDangerousTransaction(props.transaction, localAccounts)
  }, [accountDataSet, accounts, props.signatureRequest, props.transaction])

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
