import React from "react"
import { Transaction } from "stellar-sdk"
import Fade from "@material-ui/core/Fade"
import { TransitionProps } from "@material-ui/core/transitions/transition"
import { StellarUriType, StellarUri, TransactionStellarUri } from "@stellarguard/stellar-uri"
import StellarGuardActivationDialog from "./Dialog/StellarGuardActivation"
import { TransactionRequestContext } from "../context/transactionRequest"
import { Dialog } from "@material-ui/core"

const Transition = React.forwardRef((props: TransitionProps, ref) => <Fade ref={ref} {...props} />)

function isStellarGuardTransaction(uri: StellarUri) {
  return uri.originDomain === "stellarguard.me" || uri.originDomain === "test.stellarguard.me"
}

function TransactionRequestHandler() {
  const { uri, clearURI } = React.useContext(TransactionRequestContext)
  const [closedStellarURI, setClosedStellarURI] = React.useState<StellarUri | null>(null)

  // We need that so we still know what to render when we fade out the dialog
  const renderedURI = uri || closedStellarURI

  const closeDialog = React.useCallback(
    () => {
      setClosedStellarURI(uri)
      clearURI()
    },
    [uri]
  )

  if (renderedURI && renderedURI.operation === StellarUriType.Transaction) {
    if (isStellarGuardTransaction(renderedURI)) {
      const transaction = new Transaction((renderedURI as TransactionStellarUri).xdr)
      return (
        <Dialog open={Boolean(uri)} fullScreen TransitionComponent={Transition}>
          <StellarGuardActivationDialog
            testnet={renderedURI.isTestNetwork}
            transaction={transaction}
            onClose={closeDialog}
          />
        </Dialog>
      )
    }
  }
  return null
}

export default React.memo(TransactionRequestHandler)
