import BigNumber from "big.js"
import React from "react"
import { Operation, Transaction } from "stellar-sdk"
import Divider from "@material-ui/core/Divider"
import List from "@material-ui/core/List"
import { unstable_useMediaQuery as useMediaQuery } from "@material-ui/core/useMediaQuery"
import OpenInNewIcon from "@material-ui/icons/OpenInNew"
import { useAccountDataSet } from "../../hooks"
import { Account, AccountsContext } from "../../context/accounts"
import { SignatureRequest } from "../../lib/multisig-service"
import { getAllSources } from "../../lib/stellar"
import { isPotentiallyDangerousTransaction, selectNetwork } from "../../lib/transaction"
import { SingleBalance } from "../Account/AccountBalances"
import { ClickableAddress, CopyableAddress } from "../PublicKey"
import { SummaryDetailsField, SummaryItem } from "./SummaryItem"
import OperationListItem from "./Operations"
import { DangerousTransactionWarning, Signers, TransactionMemo } from "./Transaction"

type TransactionWithUndocumentedProps = Transaction & {
  created_at: string
}

function getTime(time: string) {
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

interface TransactionSummaryProps {
  account: Account | null
  onHashClick?: () => void
  showHash?: boolean
  showSource?: boolean
  signatureRequest?: SignatureRequest
  testnet: boolean
  transaction: Transaction
}

function TransactionSummary(props: TransactionSummaryProps) {
  const allTxSources = getAllSources(props.transaction)
  const { accounts } = React.useContext(AccountsContext)
  const accountDataSet = useAccountDataSet(allTxSources, props.testnet)

  const accountData = accountDataSet.find(someAccountData => someAccountData.id === props.transaction.source)
  const showSigners = accountDataSet.some(someAccountData => someAccountData.signers.length > 1)
  const localAccountPublicKey = props.account ? props.account.publicKey : undefined

  if (!accountData) {
    throw new Error(
      "Invariant violation: " +
        "Cannot find the transaction source account's account data in set of account data subscriptions."
    )
  }

  const fee = BigNumber(props.transaction.fee)
    .mul(props.transaction.operations.length)
    .div(1e7)

  const isDangerousSignatureRequest = React.useMemo(
    () => {
      const localAccounts = accountDataSet.filter(someAccountData =>
        accounts.some(account => account.publicKey === someAccountData.id)
      )
      return props.signatureRequest && isPotentiallyDangerousTransaction(props.transaction, localAccounts)
    },
    [accountDataSet, accounts, props.signatureRequest, props.transaction]
  )

  const isSmallScreen = useMediaQuery("(max-width:500px)")
  const isWideScreen = useMediaQuery("(min-width:900px)")
  const widthStyling = isWideScreen ? { maxWidth: 700, minWidth: 320 } : { minWidth: "66vw" }

  const transaction = props.transaction as TransactionWithUndocumentedProps
  const transactionHash = React.useMemo(
    () => {
      selectNetwork(props.testnet)
      return transaction.hash().toString("hex")
    },
    [transaction]
  )

  return (
    <List style={{ margin: "24px 0", paddingLeft: 0, paddingRight: 0, ...widthStyling }}>
      {isDangerousSignatureRequest ? <DangerousTransactionWarning /> : null}
      {props.transaction.operations.map((operation, index) => (
        <OperationListItem
          key={index}
          accountData={accountData}
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
      {showSigners ? (
        <Signers
          accounts={accounts}
          accountData={accountData}
          transaction={props.transaction}
          style={noHPaddingStyle}
        />
      ) : null}
      {props.showSource || props.showHash ? (
        <SummaryItem>
          {props.showSource ? (
            <SummaryDetailsField
              label="Source Account"
              value={<CopyableAddress address={props.transaction.source} variant="short" />}
            />
          ) : null}
          {props.showHash ? (
            <SummaryDetailsField
              label="Hash"
              value={
                <ClickableAddress
                  address={transactionHash}
                  icon={<OpenInNewIcon style={{ marginLeft: 4, fontSize: "inherit" }} />}
                  onClick={props.onHashClick}
                  variant={isSmallScreen ? "shorter" : "short"}
                />
              }
            />
          ) : null}
        </SummaryItem>
      ) : null}
      <SummaryItem>
        <SummaryDetailsField label="Fee" value={<SingleBalance assetCode="XLM" balance={fee.toString()} inline />} />
        {transaction.created_at ? (
          <SummaryDetailsField label="Submission" value={getTime(transaction.created_at)} />
        ) : null}
      </SummaryItem>
    </List>
  )
}

export default React.memo(TransactionSummary)
