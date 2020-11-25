import React from "react"
import Fade from "@material-ui/core/Fade"
import { TransitionProps } from "@material-ui/core/transitions/transition"
import { Dialog } from "@material-ui/core"
import { StellarUriType, StellarUri, PayStellarUri } from "@stellarguard/stellar-uri"
import { TransactionRequestContext } from "~App/contexts/transactionRequest"
import { SettingsContext } from "~App/contexts/settings"
import VerifyTrustedServiceDialog from "./VerifyTrustedServiceDialog"
import PaymentAccountSelectionDialog from "./PaymentAccountSelectionDialog"

const Transition = React.forwardRef((props: TransitionProps, ref) => <Fade ref={ref} {...props} />)

function TransactionRequestHandler() {
  const { uri, clearURI } = React.useContext(TransactionRequestContext)
  const { trustedServices, setSetting } = React.useContext(SettingsContext)
  const [closedStellarURI, setClosedStellarURI] = React.useState<StellarUri | null>(null)

  // We need that so we still know what to render when we fade out the dialog
  const renderedURI = uri || closedStellarURI

  const closeDialog = React.useCallback(() => {
    setClosedStellarURI(uri)
    clearURI()

    // Clear location href, since it might contain secret search params
    window.history.pushState({}, "Solar Wallet", window.location.href.replace(window.location.search, ""))
  }, [clearURI, uri])

  if (!renderedURI) {
    return null
  }

  const trustedService = trustedServices.find(service => renderedURI.originDomain === service.domain)
  if (renderedURI.originDomain && !trustedService) {
    const onTrust = () => {
      const newTrustedServices: TrustedService[] = [
        ...trustedServices,
        { domain: renderedURI.originDomain!, signingKey: renderedURI.pubkey }
      ]
      setSetting("trustedServices", newTrustedServices)
    }
    const onDeny = () => {
      closeDialog()
    }

    return (
      <Dialog open={Boolean(uri)} fullScreen TransitionComponent={Transition}>
        <VerifyTrustedServiceDialog onTrust={onTrust} onCancel={onDeny} domain={renderedURI.originDomain} />
      </Dialog>
    )
  }

  if (renderedURI.operation === StellarUriType.Pay) {
    const payStellarUri = renderedURI as PayStellarUri
    const onDismiss = () => {
      closeDialog()
    }

    return (
      <Dialog open={Boolean(uri)} fullScreen TransitionComponent={Transition}>
        <PaymentAccountSelectionDialog payStellarUri={payStellarUri} onDismiss={onDismiss} />
      </Dialog>
    )
  }

  return null
}

export default React.memo(TransactionRequestHandler)
