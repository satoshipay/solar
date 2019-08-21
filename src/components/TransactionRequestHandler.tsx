import React from "react"
import { Transaction } from "stellar-sdk"
import Fade from "@material-ui/core/Fade"
import { TransitionProps } from "@material-ui/core/transitions/transition"
import { Dialog } from "@material-ui/core"
import { StellarUriType, StellarUri, TransactionStellarUri } from "@stellarguard/stellar-uri"
import StellarGuardActivationDialog from "./Dialog/StellarGuardActivation"
import { TransactionRequestContext } from "../context/transactionRequest"
import { SolarUriType, SolarUri } from "../lib/solar-uri"
import CreateAccountPage from "../pages/create-account"

const Transition = React.forwardRef((props: TransitionProps, ref) => <Fade ref={ref} {...props} />)

function isStellarGuardTransaction(uri: StellarUri) {
  return uri.originDomain === "stellarguard.me" || uri.originDomain === "test.stellarguard.me"
}

function TransactionRequestHandler() {
  const { uri, clearURI } = React.useContext(TransactionRequestContext)
  const [closedStellarURI, setClosedStellarURI] = React.useState<StellarUri | SolarUri | null>(null)

  // We need that so we still know what to render when we fade out the dialog
  const renderedURI = uri || closedStellarURI

  const closeDialog = React.useCallback(
    () => {
      setClosedStellarURI(uri)
      clearURI()

      // Clear location href, since it might contain secret search params
      window.history.pushState({}, "Solar Wallet", window.location.href.replace(window.location.search, ""))
    },
    [uri]
  )

  if (!renderedURI) {
    return null
  }

  if (renderedURI.operation === StellarUriType.Transaction) {
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
  } else if (renderedURI.operation === SolarUriType.Import) {
    const secretKey = renderedURI.getParam("secret")
    if (secretKey) {
      return (
        <Dialog open={Boolean(uri)} fullScreen TransitionComponent={Transition}>
          <CreateAccountPage importedSecretKey={secretKey} onClose={closeDialog} testnet={renderedURI.isTestNetwork} />
        </Dialog>
      )
    }
  }

  return null
}

export default React.memo(TransactionRequestHandler)
