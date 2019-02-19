import React from "react"
import { useContext, useMemo } from "react"
import { Memo, Operation, Transaction } from "stellar-sdk"
import Divider from "@material-ui/core/Divider"
import MuiListItem from "@material-ui/core/ListItem"
import MuiListItemIcon from "@material-ui/core/ListItemIcon"
import MuiListItemText from "@material-ui/core/ListItemText"
import Tooltip from "@material-ui/core/Tooltip"
import amber from "@material-ui/core/colors/amber"
import CheckIcon from "@material-ui/icons/Check"
import UpdateIcon from "@material-ui/icons/Update"
import WarningIcon from "@material-ui/icons/Warning"
import { useAccountDataSet } from "../../hooks"
import { Account, AccountsContext } from "../../context/accounts"
import { SignatureRequest } from "../../lib/multisig-service"
import { getAllSources, signatureMatchesPublicKey } from "../../lib/stellar"
import { ObservedAccountData } from "../../lib/subscriptions"
import { isPotentiallyDangerousTransaction } from "../../lib/transaction"
import { HorizontalLayout } from "../Layout/Box"
import { List, ListItem } from "../List"
import PublicKey from "../PublicKey"
import OperationListItem from "./Operations"

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

function MetaDetails(props: { children: React.ReactNode }) {
  return <div style={{ fontSize: "80%", marginTop: 8, marginLeft: 16 }}>{props.children}</div>
}

function TransactionMemo(props: { memo: Memo; style?: React.CSSProperties }) {
  if (props.memo.type === "none" || !props.memo.value) return null

  const memo = typeof props.memo.value === "string" ? props.memo.value : props.memo.value.toString("hex")
  const typeLabel = props.memo.type.substr(0, 1).toUpperCase() + props.memo.type.substr(1)

  return <ListItem heading={`${typeLabel} Memo`} primaryText={<MetaDetails>{memo}</MetaDetails>} style={props.style} />
}

function SignerStatus(props: { hasSigned: boolean; style?: React.CSSProperties }) {
  const Icon = props.hasSigned ? CheckIcon : UpdateIcon
  return (
    <Tooltip title={props.hasSigned ? "Has signed the transaction" : "Awaiting their signature"}>
      <Icon style={{ opacity: props.hasSigned ? 1 : 0.5, ...props.style }} />
    </Tooltip>
  )
}

// tslint:disable-next-line no-shadowed-variable
const Signer = React.memo(function Signer(props: {
  hasSigned: boolean
  signer: { public_key: string; weight: number }
  transaction: Transaction
}) {
  return (
    <HorizontalLayout alignItems="center">
      <>
        <SignerStatus hasSigned={props.hasSigned} style={{ marginRight: 8 }} />
        <div style={{ whiteSpace: "nowrap" }}>
          <PublicKey
            publicKey={props.signer.public_key}
            style={{ display: "inline-block", fontWeight: "normal", minWidth: 480 }}
            variant="full"
          />
        </div>
      </>
    </HorizontalLayout>
  )
})

function Signers(props: {
  accounts: Account[]
  accountData: ObservedAccountData
  transaction: Transaction
  style?: React.CSSProperties
}) {
  // TODO: We should not get the signers from the source account data, but either
  //       a) from the signature request or
  //       b) by taking the tx source and all operation source accounts into account
  const headingDetails = props.accountData.signers.every(signer => signer.weight === 1)
    ? `${props.accountData.thresholds.high_threshold} of ${props.accountData.signers.length} multi-signature`
    : `Custom consensus multi-signature`
  return (
    <ListItem
      heading={`Signers (${headingDetails})`}
      primaryText={
        <MetaDetails>
          <>
            {props.accountData.signers.map(signer => (
              <Signer
                key={signer.public_key}
                hasSigned={props.transaction.signatures.some(signature =>
                  signatureMatchesPublicKey(signature, signer.public_key)
                )}
                signer={signer}
                transaction={props.transaction}
              />
            ))}
          </>
        </MetaDetails>
      }
      style={props.style}
    />
  )
}

function SourceAccount(props: { transaction: Transaction; style?: React.CSSProperties }) {
  return (
    <ListItem
      heading="Source Account"
      primaryText={
        <MetaDetails>
          <PublicKey publicKey={props.transaction.source} style={{ fontWeight: "normal" }} variant="full" />
        </MetaDetails>
      }
      style={props.style}
    />
  )
}

function DangerousTransactionWarning(props: { style?: React.CSSProperties }) {
  return (
    <MuiListItem style={{ background: amber["500"], ...props.style }}>
      <MuiListItemIcon>
        <WarningIcon />
      </MuiListItemIcon>
      <MuiListItemText
        primary="Transaction initiated by unrecognized account"
        secondary="Please review carefully. In case of doubt, prefer dismissing."
      />
    </MuiListItem>
  )
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
  const { accounts } = useContext(AccountsContext)
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

  const isDangerousSignatureRequest = useMemo(
    () => {
      const localAccounts = accountDataSet.filter(someAccountData =>
        accounts.some(account => account.publicKey === someAccountData.id)
      )
      return props.signatureRequest && isPotentiallyDangerousTransaction(props.transaction, localAccounts)
    },
    [accountDataSet, accounts, props.signatureRequest, props.transaction]
  )

  return (
    <List>
      {isDangerousSignatureRequest ? <DangerousTransactionWarning /> : null}
      {props.transaction.operations.map((operation, index) => (
        <OperationListItem
          key={index}
          operation={
            props.showSource
              ? makeOperationSourceExplicit(operation, props.transaction, localAccountPublicKey)
              : operation
          }
          style={noHPaddingStyle}
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
    </List>
  )
}

export default TransactionSummary
