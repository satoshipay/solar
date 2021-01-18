import React from "react"
import Fade from "@material-ui/core/Fade"
import { TransitionProps } from "@material-ui/core/transitions/transition"
import { Dialog } from "@material-ui/core"
import { StellarUriType, StellarUri, PayStellarUri, TransactionStellarUri } from "@stellarguard/stellar-uri"
import { TransactionRequestContext } from "~App/contexts/transactionRequest"
import { SettingsContext } from "~App/contexts/settings"
import VerifyTrustedServiceDialog from "./VerifyTrustedServiceDialog"
import PaymentRequestReviewDialog from "./PaymentRequestReviewDialog"
import TransactionRequestReviewDialog from "./TransactionRequestReviewDialog"

const Transition = React.forwardRef((props: TransitionProps, ref) => <Fade ref={ref} {...props} />)

function StellarUriHandler() {
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
    const onClose = () => {
      closeDialog()
    }

    return (
      <Dialog open={Boolean(uri)} fullScreen TransitionComponent={Transition}>
        <PaymentRequestReviewDialog payStellarUri={payStellarUri} onClose={onClose} />
      </Dialog>
    )
  } else {
    const txStellarUri = renderedURI as TransactionStellarUri
    const onClose = () => {
      closeDialog()
    }

    return (
      <Dialog open={Boolean(uri)} fullScreen TransitionComponent={Transition}>
        <TransactionRequestReviewDialog txStellarUri={txStellarUri} onClose={onClose} />
      </Dialog>
    )
  }
}

export default React.memo(StellarUriHandler)
