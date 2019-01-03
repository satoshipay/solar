import { History } from "history"
import { useContext, useEffect } from "react"
import { withRouter } from "react-router-dom"
import { SignatureDelegationContext } from "../context/signatureDelegation"
import { SignatureRequest } from "../lib/multisig-service"
import * as routes from "../routes"

interface Props {
  history: History
}

function DesktopNotifications(props: Props) {
  const { subscribeToNewSignatureRequests } = useContext(SignatureDelegationContext)

  const handleNewSignatureRequest = (signatureRequest: SignatureRequest) => {
    const signersHavingSigned = signatureRequest._embedded.signers.filter(signer => signer.has_signed)

    const notification = new Notification("New signature request", {
      body: `From ${signersHavingSigned.map(signer => signer.account_id).join(", ")}`
    })
    notification.addEventListener("click", () => props.history.push(routes.allAccounts()))
  }

  useEffect(() => {
    const unsubscribeFromNewSignatureRequests = subscribeToNewSignatureRequests(handleNewSignatureRequest)
    return unsubscribeFromNewSignatureRequests
  }, [])

  return null
}

export default withRouter(DesktopNotifications)
