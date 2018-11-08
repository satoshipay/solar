import React from "react"
import { isMultisigEnabled, getMultisigServiceURL } from "../feature-flags"
import { fetchSignatureRequests, subscribeToSignatureRequests, SignatureRequest } from "../lib/multisig-service"
import { Account } from "./accounts"
import { addError } from "./notifications"

interface ContextValue {
  pendingSignatureRequests: SignatureRequest[]
}

const SignatureDelegationContext = React.createContext<ContextValue>({
  pendingSignatureRequests: []
})

interface Props {
  accounts: Account[]
  children: React.ReactNode
}

interface State {
  pendingSignatureRequests: SignatureRequest[]
  subscribedAccountsKey: string
}

class SignatureDelegationProvider extends React.Component<Props, State> {
  state: State = {
    pendingSignatureRequests: [],
    subscribedAccountsKey: this.createSubscribedAccountsKey(this.props.accounts)
  }

  constructor(props: Props) {
    super(props)

    const accountIDs = this.props.accounts.map(account => account.publicKey)
    this.subscribeToAccounts(accountIDs)
  }

  unsubscribeFromSignatureRequests: () => void = () => undefined

  componentDidUpdate() {
    const accountIDs = this.props.accounts.map(account => account.publicKey)
    const newSubscribedAccountsKey = this.createSubscribedAccountsKey(this.props.accounts)

    if (newSubscribedAccountsKey !== this.state.subscribedAccountsKey) {
      this.unsubscribeFromSignatureRequests()
      this.subscribeToAccounts(accountIDs)
      this.setState({ subscribedAccountsKey: newSubscribedAccountsKey })
    }
  }

  componentWillUnmount() {
    this.unsubscribeFromSignatureRequests()
    this.setState({ pendingSignatureRequests: [] })
  }

  createSubscribedAccountsKey(accounts: Account[]) {
    return accounts.map(account => account.publicKey).join(",")
  }

  subscribeToAccounts = (accountIDs: string[]) => {
    fetchSignatureRequests(getMultisigServiceURL(), accountIDs)
      .then(pendingSignatureRequests => this.setState({ pendingSignatureRequests: pendingSignatureRequests.reverse() }))
      .catch(addError)

    this.unsubscribeFromSignatureRequests = subscribeToSignatureRequests(getMultisigServiceURL(), accountIDs, {
      onNewSignatureRequest: signatureRequest => {
        this.setState(state => ({
          pendingSignatureRequests: [signatureRequest, ...state.pendingSignatureRequests]
        }))
      },
      onSignatureRequestSubmitted: signatureRequest => {
        this.setState(state => ({
          pendingSignatureRequests: state.pendingSignatureRequests.filter(
            request => request.hash !== signatureRequest.hash
          )
        }))
      }
    })
  }

  render() {
    const contextValue: ContextValue = {
      pendingSignatureRequests: this.state.pendingSignatureRequests
    }
    return (
      <SignatureDelegationContext.Provider value={contextValue}>
        {this.props.children}
      </SignatureDelegationContext.Provider>
    )
  }
}

export const SignatureDelegationConsumer = SignatureDelegationContext.Consumer

const FeatureFlaggedProvider = (props: Props) => {
  if (isMultisigEnabled()) {
    return <SignatureDelegationProvider {...props} />
  } else {
    return (
      <SignatureDelegationContext.Provider value={{ pendingSignatureRequests: [] }}>
        {props.children}
      </SignatureDelegationContext.Provider>
    )
  }
}

export { ContextValue as SignatureDelegationContext, FeatureFlaggedProvider as SignatureDelegationProvider }
