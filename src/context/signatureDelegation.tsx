import React from "react"
import { useContext, useEffect, useRef, useState } from "react"
import { fetchSignatureRequests, subscribeToSignatureRequests, SignatureRequest } from "../lib/multisig-service"
import { Account, AccountsContext } from "./accounts"
import { trackError } from "./notifications"
import { SettingsContext } from "./settings"

interface ContextValue {
  pendingSignatureRequests: SignatureRequest[]
  subscribeToNewSignatureRequests: (subscriber: (signatureRequest: SignatureRequest) => void) => () => void
}

type SignatureRequestCallback = (signatureRequest: SignatureRequest) => void

interface SubscribersState {
  newRequestSubscribers: SignatureRequestCallback[]
}

const SignatureDelegationContext = React.createContext<ContextValue>({
  pendingSignatureRequests: [],
  subscribeToNewSignatureRequests: () => () => undefined
})

function useSignatureRequestSubscription(multiSignatureServiceURL: string, accounts: Account[]) {
  const accountIDs = accounts.map(account => account.publicKey)

  const { ignoredSignatureRequests } = useContext(SettingsContext)
  const subscribersRef = useRef<SubscribersState>({ newRequestSubscribers: [] })
  const [pendingSignatureRequests, setPendingSignatureRequests] = useState<SignatureRequest[]>([])

  useEffect(() => {
    fetchSignatureRequests(multiSignatureServiceURL, accountIDs)
      .then(requests => setPendingSignatureRequests(requests.reverse()))
      .catch(trackError)

    const unsubscribe = subscribeToSignatureRequests(multiSignatureServiceURL, accountIDs, {
      onNewSignatureRequest: signatureRequest => {
        setPendingSignatureRequests(prevPending => [signatureRequest, ...prevPending])
        subscribersRef.current.newRequestSubscribers.forEach(subscriber => subscriber(signatureRequest))
      },
      onSignatureRequestSubmitted: signatureRequest => {
        setPendingSignatureRequests(prevPending =>
          prevPending.filter(request => request.hash !== signatureRequest.hash)
        )
      }
    })
    return unsubscribe
  }, accounts)

  const subscribeToNewSignatureRequests = (callback: SignatureRequestCallback) => {
    subscribersRef.current.newRequestSubscribers.push(callback)

    const unsubscribe = () => {
      subscribersRef.current.newRequestSubscribers = subscribersRef.current.newRequestSubscribers.filter(
        subscriber => subscriber !== callback
      )
    }
    return unsubscribe
  }

  const filteredPendingSignatureRequests = pendingSignatureRequests.filter(
    signatureRequest => ignoredSignatureRequests.indexOf(signatureRequest.hash) === -1
  )

  return {
    pendingSignatureRequests: filteredPendingSignatureRequests,
    subscribeToNewSignatureRequests
  }
}

interface Props {
  children: React.ReactNode
}

function SignatureDelegationProvider(props: Props) {
  const { accounts } = useContext(AccountsContext)
  const settings = useContext(SettingsContext)
  const contextValue: ContextValue = useSignatureRequestSubscription(settings.multiSignatureServiceURL, accounts)

  return (
    <SignatureDelegationContext.Provider value={contextValue}>{props.children}</SignatureDelegationContext.Provider>
  )
}

function FeatureFlaggedProvider(props: Props) {
  const settings = useContext(SettingsContext)

  if (settings.multiSignature) {
    return <SignatureDelegationProvider {...props} />
  } else {
    const value = {
      pendingSignatureRequests: [],
      subscribeToNewSignatureRequests: () => () => undefined
    }
    return <SignatureDelegationContext.Provider value={value}>{props.children}</SignatureDelegationContext.Provider>
  }
}

export {
  ContextValue as SignatureDelegationContextType,
  FeatureFlaggedProvider as SignatureDelegationProvider,
  SignatureDelegationContext
}
