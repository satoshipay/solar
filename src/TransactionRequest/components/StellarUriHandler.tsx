import { Dialog } from "@material-ui/core"
import Fade from "@material-ui/core/Fade"
import { TransitionProps } from "@material-ui/core/transitions/transition"
import { StellarUri } from "@stellarguard/stellar-uri"
import React from "react"
import { SettingsContext } from "~App/contexts/settings"
import { TransactionRequestContext } from "~App/contexts/transactionRequest"
import StellarRequestReviewDialog from "./StellarRequestReviewDialog"
import VerifyTrustedServiceDialog from "./VerifyTrustedServiceDialog"

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

  return (
    <Dialog open={Boolean(uri)} fullScreen TransitionComponent={Transition}>
      <StellarRequestReviewDialog stellarUri={renderedURI} onClose={closeDialog} />
    </Dialog>
  )
}

export default React.memo(StellarUriHandler)
