import React from "react"
import { SignatureRequest, deserializeSignatureRequest } from "../lib/multisig-service"
import { workers } from "../worker-controller"
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

  const { ignoredSignatureRequests } = React.useContext(SettingsContext)
  const subscribersRef = React.useRef<SubscribersState>({ newRequestSubscribers: [] })
  const [pendingSignatureRequests, setPendingSignatureRequests] = React.useState<SignatureRequest[]>([])

  React.useEffect(() => {
    if (accounts.length === 0) {
      // The GET request will otherwise fail if there are no accounts to be queried
      return () => undefined
    }

    let cancelled = false
    let unsubscribe = () => {
      cancelled = true
    }

    const setup = async () => {
      const { netWorker } = await workers

      netWorker
        .fetchSignatureRequests(multiSignatureServiceURL, accountIDs)
        .then(requests => setPendingSignatureRequests(requests.reverse().map(deserializeSignatureRequest)))
        .catch(trackError)

      if (cancelled) {
        return
      }

      const signatureRequests = netWorker.subscribeToSignatureRequests(multiSignatureServiceURL, accountIDs)

      const subscription = signatureRequests.subscribe(event => {
        if (event.type === "NewSignatureRequest") {
          setPendingSignatureRequests(prevPending => [
            deserializeSignatureRequest(event.signatureRequest),
            ...prevPending
          ])
          subscribersRef.current.newRequestSubscribers.forEach(subscriber =>
            subscriber(deserializeSignatureRequest(event.signatureRequest))
          )
        }
        if (event.type === "SignatureRequestSubmitted") {
          setPendingSignatureRequests(prevPending =>
            prevPending.filter(request => request.hash !== event.signatureRequest.hash)
          )
        }
      })

      unsubscribe = () => subscription.unsubscribe()
    }

    setup().catch(trackError)

    // Do not shorten to `return unsubscribe`, as we always want to call the current `unsubscribe`
    return () => unsubscribe()
  }, [accountIDs.join(",")])

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
  const { accounts } = React.useContext(AccountsContext)
  const settings = React.useContext(SettingsContext)
  const contextValue: ContextValue = useSignatureRequestSubscription(settings.multiSignatureServiceURL, accounts)

  return (
    <SignatureDelegationContext.Provider value={contextValue}>{props.children}</SignatureDelegationContext.Provider>
  )
}

function FeatureFlaggedProvider(props: Props) {
  const settings = React.useContext(SettingsContext)

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
