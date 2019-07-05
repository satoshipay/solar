import React from "react"
import { Transaction } from "stellar-sdk"
import { StellarUriType, StellarUri, TransactionStellarUri } from "@stellarguard/stellar-uri"
import StellarGuardActivationDialog from "./Dialog/StellarGuardActivation"
import { TransactionRequestContext } from "../context/transactionRequest"
import { Dialog } from "@material-ui/core"

function isStellarGuardTransaction(uri: StellarUri) {
  return uri.originDomain === "stellarguard.me" || uri.originDomain === "test.stellarguard.me"
}

function TransactionRequestHandler() {
  const { uri, clearURI } = React.useContext(TransactionRequestContext)

  if (uri && uri.operation === StellarUriType.Transaction) {
    if (isStellarGuardTransaction(uri)) {
      const transaction = new Transaction((uri as TransactionStellarUri).xdr)
      return (
        <Dialog open={Boolean(uri)} fullScreen>
          <StellarGuardActivationDialog testnet={uri.isTestNetwork} transaction={transaction} onClose={clearURI} />
        </Dialog>
      )
    } else {
      return <></>
    }
  } else {
    return <></>
  }
}

export default TransactionRequestHandler
