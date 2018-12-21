import { History } from "history"
import React from "react"
import { withRouter } from "react-router-dom"
import { SignatureDelegationConsumer, SignatureDelegationContextType } from "../context/signatureDelegation"
import { SignatureRequest } from "../lib/multisig-service"
import * as routes from "../routes"

type UnsubscribeFromNewSignatureRequests = ReturnType<SignatureDelegationContextType["subscribeToNewSignatureRequests"]>

interface Props {
  history: History
  subscribeToNewSignatureRequests: SignatureDelegationContextType["subscribeToNewSignatureRequests"]
}

class DesktopNotifications extends React.Component<Props> {
  unsubscribeFromNewSignatureRequests: UnsubscribeFromNewSignatureRequests = () => undefined

  componentWillMount() {
    this.unsubscribeFromNewSignatureRequests = this.props.subscribeToNewSignatureRequests(
      this.handleNewSignatureRequest
    )

    // tslint:disable-next-line:no-console
    Notification.requestPermission().catch(console.error)
  }

  componentWillUnmount() {
    this.unsubscribeFromNewSignatureRequests()
  }

  handleNewSignatureRequest = (signatureRequest: SignatureRequest) => {
    const signersHavingSigned = signatureRequest._embedded.signers.filter(signer => signer.has_signed)

    const notification = new Notification("New signature request", {
      body: `From ${signersHavingSigned.map(signer => signer.account_id).join(", ")}`
    })
    notification.addEventListener("click", () => this.props.history.push(routes.allAccounts()))
  }

  render() {
    return null
  }
}

const DesktopNotificationsContainer = (props: Pick<Props, "history">) => {
  return (
    <SignatureDelegationConsumer>
      {({ subscribeToNewSignatureRequests }) => (
        <DesktopNotifications {...props} subscribeToNewSignatureRequests={subscribeToNewSignatureRequests} />
      )}
    </SignatureDelegationConsumer>
  )
}

export default withRouter(DesktopNotificationsContainer)
