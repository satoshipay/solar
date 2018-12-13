import React from "react"
import { fetchSignatureRequests, subscribeToSignatureRequests, SignatureRequest } from "../lib/multisig-service"
import { Account } from "./accounts"
import { addError } from "./notifications"
import { SettingsContext } from "./settings"

interface ContextValue {
  pendingSignatureRequests: SignatureRequest[]
  subscribeToNewSignatureRequests: (subscriber: (signatureRequest: SignatureRequest) => void) => () => void
}

const SignatureDelegationContext = React.createContext<ContextValue>({
  pendingSignatureRequests: [],
  subscribeToNewSignatureRequests: () => () => undefined
})

interface Props {
  accounts: Account[]
  children: React.ReactNode
  settings: SettingsContext
}

interface State {
  newSignatureRequestSubscribers: Array<(signatureRequest: SignatureRequest) => void>
  pendingSignatureRequests: SignatureRequest[]
  subscribedAccountsKey: string
}

class SignatureDelegationProvider extends React.Component<Props, State> {
  state: State = {
    newSignatureRequestSubscribers: [],
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
    const multiSignatureServiceURL = this.props.settings.multiSignatureServiceURL

    fetchSignatureRequests(multiSignatureServiceURL, accountIDs)
      .then(pendingSignatureRequests => this.setState({ pendingSignatureRequests: pendingSignatureRequests.reverse() }))
      .catch(addError)

    this.unsubscribeFromSignatureRequests = subscribeToSignatureRequests(multiSignatureServiceURL, accountIDs, {
      onNewSignatureRequest: signatureRequest => {
        this.setState(state => ({
          pendingSignatureRequests: [signatureRequest, ...state.pendingSignatureRequests]
        }))
        for (const subscriber of this.state.newSignatureRequestSubscribers) {
          subscriber(signatureRequest)
        }
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

  subscribeToNewSignatureRequests = (subscriber: (signatureRequest: SignatureRequest) => void) => {
    this.setState(state => ({
      newSignatureRequestSubscribers: [...state.newSignatureRequestSubscribers, subscriber]
    }))

    return () => {
      this.setState(state => ({
        newSignatureRequestSubscribers: state.newSignatureRequestSubscribers.filter(func => func !== subscriber)
      }))
    }
  }

  render() {
    const contextValue: ContextValue = {
      pendingSignatureRequests: this.state.pendingSignatureRequests,
      subscribeToNewSignatureRequests: this.subscribeToNewSignatureRequests
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
  if (props.settings.multiSignature) {
    return <SignatureDelegationProvider {...props} />
  } else {
    const value = {
      pendingSignatureRequests: [],
      subscribeToNewSignatureRequests: () => () => undefined
    }
    return <SignatureDelegationContext.Provider value={value}>{props.children}</SignatureDelegationContext.Provider>
  }
}

export { ContextValue as SignatureDelegationContext, FeatureFlaggedProvider as SignatureDelegationProvider }
