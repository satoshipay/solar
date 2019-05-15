import React from "react"
import { Operation, Transaction } from "stellar-sdk"
import Divider from "@material-ui/core/Divider"
import { Typography } from "@material-ui/core"
import { useAccountDataSet } from "../../hooks"
import { Account, AccountsContext } from "../../context/accounts"
import { SignatureRequest } from "../../lib/multisig-service"
import { getAllSources } from "../../lib/stellar"
import { isPotentiallyDangerousTransaction } from "../../lib/transaction"
import { List, ListItem } from "../List"
import OperationListItem from "./Operations"
import {
  DangerousTransactionWarning,
  Signers,
  SourceAccount,
  TransactionMemo,
  TransactionMetadata
} from "./Transaction"

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

interface TransactionSummaryProps {
  account: Account | null
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

  const noHPaddingStyle = {
    paddingLeft: 0,
    paddingRight: 0
  }

  if (!accountData) {
    throw new Error(
      "Invariant violation: " +
        "Cannot find the transaction source account's account data in set of account data subscriptions."
    )
  }

  const isDangerousSignatureRequest = React.useMemo(
    () => {
      const localAccounts = accountDataSet.filter(someAccountData =>
        accounts.some(account => account.publicKey === someAccountData.id)
      )
      return props.signatureRequest && isPotentiallyDangerousTransaction(props.transaction, localAccounts)
    },
    [accountDataSet, accounts, props.signatureRequest, props.transaction]
  )

  const transaction = props.transaction as TransactionWithUndocumentedProps

  return (
    <List style={{ paddingLeft: 0, paddingRight: 0 }}>
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
      <TransactionMemo memo={props.transaction.memo} style={noHPaddingStyle} />
      {props.showSource || showSigners ? <Divider /> : null}
      {showSigners ? (
        <Signers
          accounts={accounts}
          accountData={accountData}
          transaction={props.transaction}
          style={noHPaddingStyle}
        />
      ) : null}
      {props.showSource ? <SourceAccount transaction={props.transaction} style={noHPaddingStyle} /> : null}
      <TransactionMetadata style={noHPaddingStyle} transaction={props.transaction} />
      {transaction.created_at ? (
        <ListItem
          heading="Submission"
          primaryText={
            <Typography style={{ marginLeft: 16, marginTop: 8, fontSize: "80%" }}>
              {getTime(transaction.created_at)}
            </Typography>
          }
          style={noHPaddingStyle}
        />
      ) : (
        undefined
      )}
    </List>
  )
}

export default TransactionSummary
