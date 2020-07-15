import React from "react"
import { resolveMultiSignatureCoordinator } from "~Generic/lib/multisig-discovery"
import { MultisigTransactionResponse, MultisigTransactionStatus } from "~Generic/lib/multisig-service"
import { workers } from "~Workers/worker-controller"
import { Account, AccountsContext } from "./accounts"
import { trackError } from "./notifications"
import { SettingsContext } from "./settings"

interface ContextValue {
  pendingSignatureRequests: MultisigTransactionResponse[]
  subscribeToNewSignatureRequests: (subscriber: (signatureRequest: MultisigTransactionResponse) => void) => () => void
}

type SignatureRequestCallback = (signatureRequest: MultisigTransactionResponse) => void

interface SubscribersState {
  newRequestSubscribers: SignatureRequestCallback[]
}

const SignatureDelegationContext = React.createContext<ContextValue>({
  pendingSignatureRequests: [],
  subscribeToNewSignatureRequests: () => () => undefined
})

function useSignatureRequestSubscription(multiSignatureCoordinator: string, accounts: Account[]) {
  const accountPubKeys = React.useMemo(() => accounts.map(account => account.publicKey), [accounts])

  const { ignoredSignatureRequests } = React.useContext(SettingsContext)
  const subscribersRef = React.useRef<SubscribersState>({ newRequestSubscribers: [] })
  const [pendingTransactions, setPendingTransactions] = React.useState<MultisigTransactionResponse[]>([])

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
      const multiSignatureServiceURL = await resolveMultiSignatureCoordinator(multiSignatureCoordinator)

      netWorker
        .fetchTransactions(multiSignatureServiceURL, accountPubKeys)
        .then(requests => setPendingTransactions(requests.reverse()))
        .catch(trackError)

      if (cancelled) {
        return
      }

      const signatureRequests = netWorker.subscribeToTransactions(multiSignatureServiceURL, accountPubKeys)

      const subscription = signatureRequests.subscribe(event => {
        if (event.type === "transaction:added") {
          setPendingTransactions(prevPending => [event.transaction, ...prevPending])
          subscribersRef.current.newRequestSubscribers.forEach(subscriber => subscriber(event.transaction))
        }
        if (event.type === "transaction:updated" && event.transaction.status === MultisigTransactionStatus.submitted) {
          setPendingTransactions(prevPending => {
            // Hacky: Also mutate existing multisig tx to make double sure everyone gets the update
            const prev = prevPending.find(request => request.hash !== event.transaction.hash)
            Object.assign(prev, event.transaction)

            return prevPending.map(request => (request.hash === event.transaction.hash ? event.transaction : request))
          })
        }
      })

      unsubscribe = () => subscription.unsubscribe()
    }

    setup().catch(trackError)

    // Do not shorten to `return unsubscribe`, as we always want to call the current `unsubscribe`
    return () => unsubscribe()
  }, [accountPubKeys, accounts.length, multiSignatureCoordinator])

  const subscribeToNewSignatureRequests = (callback: SignatureRequestCallback) => {
    subscribersRef.current.newRequestSubscribers.push(callback)

    const unsubscribe = () => {
      subscribersRef.current.newRequestSubscribers = subscribersRef.current.newRequestSubscribers.filter(
        subscriber => subscriber !== callback
      )
    }
    return unsubscribe
  }

  const filteredPendingSignatureRequests = pendingTransactions.filter(
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
  const contextValue: ContextValue = useSignatureRequestSubscription(settings.multiSignatureCoordinator, accounts)

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
