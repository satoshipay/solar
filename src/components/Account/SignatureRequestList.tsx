import React from "react"
import { Transaction } from "stellar-sdk"
import ListSubheader from "@material-ui/core/ListSubheader"
import SignatureRequestIcon from "@material-ui/icons/Send"
import { Account } from "../../context/accounts"
import { SignatureRequest } from "../../lib/multisig-service"
import { List } from "../List"
import { TransactionListItem } from "./TransactionList"
import TransactionSender from "../TransactionSender"

const SignatureRequestListItem = (props: {
  accountPublicKey: string
  onOpenTransaction?: (tx: Transaction) => void
  signatureRequest: SignatureRequest
}) => {
  const { onOpenTransaction, signatureRequest } = props

  const signedByThisAccountAlready = signatureRequest._embedded.signers.find(
    signer => signer.account_id === props.accountPublicKey
  )
  return (
    <TransactionListItem
      key={signatureRequest.hash}
      accountPublicKey={props.accountPublicKey}
      createdAt={signatureRequest.created_at}
      icon={<SignatureRequestIcon style={{ opacity: signedByThisAccountAlready ? 0.5 : 1 }} />}
      onClick={onOpenTransaction ? () => onOpenTransaction(signatureRequest.meta.transaction) : undefined}
      transaction={signatureRequest.meta.transaction}
    />
  )
}

export const SignatureRequestList = (props: {
  accountPublicKey: string
  onOpenTransaction?: (transaction: Transaction) => void
  signatureRequests: SignatureRequest[]
  title: React.ReactNode
}) => {
  if (props.signatureRequests.length === 0) {
    return null
  }
  return (
    <List>
      <ListSubheader>{props.title}</ListSubheader>
      {props.signatureRequests.map(signatureRequest => (
        <SignatureRequestListItem
          accountPublicKey={props.accountPublicKey}
          onOpenTransaction={props.onOpenTransaction}
          signatureRequest={signatureRequest}
        />
      ))}
    </List>
  )
}

export const InteractiveSignatureRequestList = (props: {
  account: Account
  signatureRequests: SignatureRequest[]
  title: React.ReactNode
}) => {
  if (props.signatureRequests.length === 0) {
    return null
  }
  return (
    <TransactionSender account={props.account}>
      {({ sendTransaction }) => (
        <SignatureRequestList
          accountPublicKey={props.account.publicKey}
          onOpenTransaction={sendTransaction}
          signatureRequests={props.signatureRequests}
          title={props.title}
        />
      )}
    </TransactionSender>
  )
}
