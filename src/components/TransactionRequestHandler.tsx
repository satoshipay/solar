import React from "react"
import { Transaction } from "stellar-sdk"
import { TransactionStellarUri } from "@stellarguard/stellar-uri"
import StellarGuardActivationDialog from "./Dialog/StellarGuardActivation"
import { TransactionRequestContext } from "../context/transactionRequest"

function isStellarGuardTransaction(uri: TransactionStellarUri) {
  return uri.originDomain === "stellarguard.me" || uri.originDomain === "test.stellarguard.me"
}

function TransactionRequestHandler() {
  const { uri, clearURI } = React.useContext(TransactionRequestContext)

  const onClose = clearURI

  if (uri instanceof TransactionStellarUri) {
    if (isStellarGuardTransaction(uri)) {
      const transaction = new Transaction(uri.xdr)
      return <StellarGuardActivationDialog transaction={transaction} onClose={onClose} />
    } else {
      return <></>
    }
  } else {
    return <></>
  }
}

export default TransactionRequestHandler
