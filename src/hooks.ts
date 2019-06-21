import * as JWT from "jsonwebtoken"
import React from "react"
import { __RouterContext, RouteComponentProps } from "react-router"
import { Asset, Server, Transaction } from "stellar-sdk"
import { unstable_useMediaQuery as useMediaQuery } from "@material-ui/core/useMediaQuery"
import * as WebAuth from "@satoshipay/stellar-sep-10"
import { Account } from "./context/accounts"
import { CachingContext } from "./context/caches"
import { NotificationsContext } from "./context/notifications"
import { StellarContext } from "./context/stellar"
import * as StellarAddresses from "./lib/stellar-address"
import { SubscriptionTarget } from "./lib/subscription"
import {
  getAssetCacheKey,
  subscribeToAccount,
  subscribeToAccountEffects,
  subscribeToAccountOffers,
  subscribeToOrders,
  subscribeToRecentTxs,
  ObservedAccountData,
  ObservedAccountOffers,
  ObservedRecentTxs,
  ObservedTradingPair
} from "./subscriptions"
import * as Clipboard from "./platform/clipboard"

export { ObservedAccountData, ObservedRecentTxs, ObservedTradingPair }

export const useIsMobile = () => useMediaQuery("(max-width:600px)")
export const useIsSmallMobile = () => useMediaQuery("(max-width:400px)")

export function useHorizon(testnet: boolean = false) {
  const stellar = React.useContext(StellarContext)
  const horizonURL = testnet ? stellar.horizonTestnetURL : stellar.horizonLivenetURL
  const horizon = React.useMemo(() => new Server(horizonURL), [horizonURL])
  return horizon
}

// TODO: Better to separate fetch() & subscribeToUpdates(), have two useEffects()

function useDataSubscriptions<ObservedData>(subscriptions: Array<SubscriptionTarget<ObservedData>>): ObservedData[] {
  const [currentDataSets, setCurrentDataSets] = React.useState<ObservedData[]>(
    subscriptions.map(subscription => subscription.getLatest())
  )

  const updateDataSets = (
    prevDataSets: ObservedData[],
    update: ObservedData,
    indexToUpdate: number
  ): ObservedData[] => {
    return prevDataSets.map((data, index) => (index === indexToUpdate ? update : data))
  }

  // Asynchronously subscribe to remote data to keep state in sync
  // `unsubscribe` will only unsubscribe state updating code, won't close remote data subscription itself
  React.useEffect(
    () => {
      // Some time has passed since the last `getLatest()`, so refresh
      setCurrentDataSets(subscriptions.map(subscription => subscription.getLatest()))

      const unsubscribeHandlers = subscriptions.map((subscription, index) =>
        subscription.subscribe(update =>
          setCurrentDataSets(prevDataSets => updateDataSets(prevDataSets, update, index))
        )
      )

      const unsubscribe = () => unsubscribeHandlers.forEach(unsubscribeHandler => unsubscribeHandler())
      return unsubscribe
    },
    [subscriptions.map(subscription => subscription.id).join(",")]
  )

  return currentDataSets
}

function useDataSubscription<ObservedData>(subscription: SubscriptionTarget<ObservedData>): ObservedData {
  return useDataSubscriptions([subscription])[0]
}

export function useAccountDataSet(accountIDs: string[], testnet: boolean): ObservedAccountData[] {
  const horizon = useHorizon(testnet)
  const accountSubscriptions = React.useMemo(
    () => accountIDs.map(accountID => subscribeToAccount(horizon, accountID)),
    [accountIDs.join(","), horizon]
  )

  return useDataSubscriptions(accountSubscriptions)
}

export function useAccountData(accountID: string, testnet: boolean): ObservedAccountData {
  return useAccountDataSet([accountID], testnet)[0]
}

export function useAccountOffers(accountID: string, testnet: boolean): ObservedAccountOffers {
  const horizon = useHorizon(testnet)

  const offersSubscription = React.useMemo(() => subscribeToAccountOffers(horizon, accountID), [accountID, horizon])

  return useDataSubscription(offersSubscription)
}

type EffectHandler = (account: Account, effect: Server.EffectRecord) => void

export function useAccountEffectSubscriptions(accounts: Account[], handler: EffectHandler) {
  const mainnetHorizon = useHorizon(false)
  const testnetHorizon = useHorizon(true)

  return React.useEffect(
    () => {
      const unsubscribeHandlers = accounts.map(account => {
        const horizon = account.testnet ? testnetHorizon : mainnetHorizon
        const subscription = subscribeToAccountEffects(horizon, account.publicKey)
        const unsubscribe = subscription.subscribe(effect => effect && handler(account, effect))
        return unsubscribe
      })

      return () => unsubscribeHandlers.forEach(unsubscribe => unsubscribe())
    },
    [accounts, mainnetHorizon, testnetHorizon]
  )
}

export function useClipboard() {
  const { showError, showNotification } = React.useContext(NotificationsContext)

  return React.useMemo(
    () => ({
      async copyToClipboard(value: string, notificationMessage: string = "Copied to clipboard.") {
        try {
          await Clipboard.copyToClipboard(value)
          showNotification("info", notificationMessage)
        } catch (error) {
          showError(error)
        }
      }
    }),
    [showError, showNotification]
  )
}

export function useOnlineStatus() {
  const [isOnline, setOnlineStatus] = React.useState(window.navigator.onLine)
  const setOffline = () => setOnlineStatus(false)
  const setOnline = () => setOnlineStatus(true)

  React.useEffect(() => {
    window.addEventListener("offline", setOffline)
    window.addEventListener("online", setOnline)
  }, [])

  return {
    isOnline
  }
}

export function useOrderbook(selling: Asset, buying: Asset, testnet: boolean): ObservedTradingPair {
  const horizon = useHorizon(testnet)

  const ordersSubscription = React.useMemo(() => subscribeToOrders(horizon, selling, buying), [
    horizon,
    getAssetCacheKey(selling),
    getAssetCacheKey(buying)
  ])

  return useDataSubscription(ordersSubscription)
}

export function useRecentTransactions(accountID: string, testnet: boolean): ObservedRecentTxs {
  const horizon = useHorizon(testnet)
  const recentTxsSubscription = React.useMemo(() => subscribeToRecentTxs(horizon, accountID), [accountID, horizon])

  return useDataSubscription(recentTxsSubscription)
}

export function useSigningKeyDomainCache() {
  const caches = React.useContext(CachingContext)
  return caches.signingKeyDomain
}

export function useFederationLookup() {
  const caches = React.useContext(CachingContext)
  return {
    lookupFederationRecord(stellarAddress: string) {
      return StellarAddresses.lookupFederationRecord(
        stellarAddress,
        caches.stellarAddresses,
        caches.stellarAddressesReverse
      )
    },
    lookupStellarAddress(publicKey: string) {
      return caches.stellarAddressesReverse.get(publicKey)
    }
  }
}

export function useWebAuth() {
  const caches = React.useContext(CachingContext)
  const createCacheKey = React.useCallback(
    (endpointURL: string, localPublicKey: string) => `${endpointURL}:${localPublicKey}`,
    []
  )

  return {
    fetchChallenge: WebAuth.fetchChallenge,

    async fetchWebAuthData(horizon: Server, issuerAccountID: string) {
      const metadata = await WebAuth.fetchWebAuthData(horizon, issuerAccountID)
      if (metadata) {
        caches.signingKeyDomain.set(metadata.signingKey, metadata.domain)
      }
      return metadata
    },

    getCachedAuthToken(endpointURL: string, localPublicKey: string) {
      return caches.webauthTokens.get(createCacheKey(endpointURL, localPublicKey))
    },

    async postResponse(endpointURL: string, transaction: Transaction) {
      const manageDataOperation = transaction.operations.find(operation => operation.type === "manageData")
      const localPublicKey = manageDataOperation ? manageDataOperation.source : undefined
      const authToken = await WebAuth.postResponse(endpointURL, transaction)

      if (localPublicKey) {
        const decoded = JWT.decode(authToken) as any
        const maxAge = decoded.exp ? Number.parseInt(decoded.exp, 10) * 1000 - Date.now() - 60_000 : undefined
        caches.webauthTokens.set(createCacheKey(endpointURL, localPublicKey), authToken, maxAge)
      }
      return authToken
    }
  }
}

// TODO: Get rid of this hook once react-router is shipped with a hook out-of-the-box
export function useRouter<Params = {}>() {
  const routerContext = React.useContext<RouteComponentProps<Params>>(__RouterContext)
  const [updateEnforcementState, setUpdateEnforcementState] = React.useState(0)

  const forceUpdate = () => setUpdateEnforcementState(updateEnforcementState + 1)

  if (!routerContext) {
    throw new Error("useRouter() hook can only be used within a react-router provider.")
  }

  React.useEffect(
    () => {
      const unsubscribe = routerContext.history.listen(() => forceUpdate())
      return unsubscribe
    },
    [routerContext]
  )

  return routerContext
}
