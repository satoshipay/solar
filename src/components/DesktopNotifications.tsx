import { useContext, useEffect } from "react"
import { SignatureDelegationContext } from "../context/signatureDelegation"
import { useRouter } from "../hooks"
import { SignatureRequest } from "../lib/multisig-service"
import * as routes from "../routes"

function DesktopNotifications() {
  const { subscribeToNewSignatureRequests } = useContext(SignatureDelegationContext)
  const router = useRouter()

  const handleNewSignatureRequest = (signatureRequest: SignatureRequest) => {
    const signersHavingSigned = signatureRequest._embedded.signers.filter(signer => signer.has_signed)

    const notification = new Notification("New signature request", {
      body: `From ${signersHavingSigned.map(signer => signer.account_id).join(", ")}`
    })
    notification.addEventListener("click", () => router.history.push(routes.allAccounts()))
  }

  useEffect(() => {
    const unsubscribeFromNewSignatureRequests = subscribeToNewSignatureRequests(handleNewSignatureRequest)
    return unsubscribeFromNewSignatureRequests
  }, [])

  return null
}

export default DesktopNotifications
