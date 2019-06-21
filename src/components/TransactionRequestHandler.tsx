import React from "react"
import { TransactionStellarUri, PayStellarUri } from "@stellarguard/stellar-uri"
import StellarGuardActivationDialog from "./Dialog/StellarGuardActivation"
import { Transaction } from "stellar-sdk"

interface Props {
  onClose: () => void
  uri: TransactionStellarUri | PayStellarUri | null
}

function isStellarGuardTransaction(uri: TransactionStellarUri) {
  return uri.originDomain === "stellarguard.me" || uri.originDomain === "test.stellarguard.me"
}

function TransactionRequestHandler(props: Props) {
  const { uri } = props

  if (uri instanceof TransactionStellarUri) {
    if (isStellarGuardTransaction(uri)) {
      const transaction = new Transaction(uri.xdr)
      return <StellarGuardActivationDialog transaction={transaction} onClose={props.onClose} />
    } else {
      return <></>
    }
  } else {
    return <></>
  }
}

export default TransactionRequestHandler
