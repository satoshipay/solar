import React from "react"
import { Transaction } from "stellar-sdk"
import ListSubheader from "@material-ui/core/ListSubheader"
import { Account } from "../../context/accounts"
import { SignatureRequest } from "../../lib/multisig-service"
import { List } from "../List"
import { TransactionListItem } from "./TransactionList"
import TransactionSender from "../TransactionSender"

const SignatureRequestListItem = (props: {
  accountPublicKey: string
  icon?: React.ReactNode
  onOpenTransaction?: (tx: Transaction, signatureRequest: SignatureRequest) => void
  signatureRequest: SignatureRequest
}) => {
  const { onOpenTransaction, signatureRequest } = props
  return (
    <TransactionListItem
      key={signatureRequest.hash}
      alwaysShowSource
      accountPublicKey={signatureRequest.meta.transaction.source}
      createdAt={signatureRequest.created_at}
      icon={props.icon}
      onClick={
        onOpenTransaction ? () => onOpenTransaction(signatureRequest.meta.transaction, signatureRequest) : undefined
      }
      transaction={signatureRequest.meta.transaction}
    />
  )
}

export const SignatureRequestList = (props: {
  accountPublicKey: string
  icon?: React.ReactNode
  onOpenTransaction?: (transaction: Transaction, signatureRequest: SignatureRequest) => void
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
          key={signatureRequest.hash}
          accountPublicKey={props.accountPublicKey}
          icon={props.icon}
          onOpenTransaction={props.onOpenTransaction}
          signatureRequest={signatureRequest}
        />
      ))}
    </List>
  )
}

export const InteractiveSignatureRequestList = (props: {
  account: Account
  icon?: React.ReactNode
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
          icon={props.icon}
          onOpenTransaction={sendTransaction}
          signatureRequests={props.signatureRequests}
          title={props.title}
        />
      )}
    </TransactionSender>
  )
}
