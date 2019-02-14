import React from "react"
import { useContext } from "react"
import { Memo, Transaction } from "stellar-sdk"
import Divider from "@material-ui/core/Divider"
import { useAccountData } from "../../hooks"
import { Account, AccountsContext } from "../../context/accounts"
import { ObservedAccountData } from "../../subscriptions"
import { List, ListItem } from "../List"
import PublicKey from "../PublicKey"
import OperationListItem from "./Operations"

function MetaDetails(props: { children: React.ReactNode }) {
  return <div style={{ fontSize: "80%", marginTop: 8, marginLeft: 16 }}>{props.children}</div>
}

function TransactionMemo(props: { memo: Memo; style?: React.CSSProperties }) {
  if (props.memo.type === "none" || !props.memo.value) return null

  const memo = typeof props.memo.value === "string" ? props.memo.value : props.memo.value.toString("hex")
  const typeLabel = props.memo.type.substr(0, 1).toUpperCase() + props.memo.type.substr(1)

  return <ListItem heading={`${typeLabel} Memo`} primaryText={<MetaDetails>{memo}</MetaDetails>} style={props.style} />
}

// tslint:disable-next-line no-shadowed-variable
const Signer = React.memo(function Signer(props: {
  accounts: Account[]
  signer: { public_key: string; weight: number }
  transaction: Transaction
}) {
  const { accounts, signer } = props
  const hints: string[] = []

  if (signer.public_key === props.transaction.source) {
    hints.push("Source account")
  }
  if (accounts.some(account => account.publicKey === signer.public_key)) {
    hints.push("Local key")
  }

  return (
    <div style={{ display: "block", whiteSpace: "nowrap" }}>
      <PublicKey
        publicKey={signer.public_key}
        style={{ display: "inline-block", fontWeight: "normal", minWidth: 480 }}
        variant="full"
      />
      {hints.length > 0 ? (
        <>
          &nbsp;(
          {hints.join(", ")})
        </>
      ) : null}
    </div>
  )
})

function Signers(props: {
  accounts: Account[]
  accountData: ObservedAccountData
  transaction: Transaction
  style?: React.CSSProperties
}) {
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
                accounts={props.accounts}
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

function TransactionSummary(props: { showSource?: boolean; testnet: boolean; transaction: Transaction }) {
  const { accounts } = useContext(AccountsContext)
  const accountData = useAccountData(props.transaction.source, props.testnet)
  const noHPaddingStyle = {
    paddingLeft: 0,
    paddingRight: 0
  }
  const showSigners = accountData.signers.length > 1
  return (
    <List>
      {props.transaction.operations.map((operation, index) => (
        <OperationListItem
          key={index}
          accountData={accountData}
          operation={operation}
          style={noHPaddingStyle}
          testnet={props.testnet}
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
      {props.showSource && !showSigners ? (
        <SourceAccount transaction={props.transaction} style={noHPaddingStyle} />
      ) : null}
    </List>
  )
}

export default TransactionSummary
