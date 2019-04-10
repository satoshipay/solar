import React from "react"
import { __RouterContext, RouteComponentProps } from "react-router"
import { Asset, Server } from "stellar-sdk"
import { unstable_useMediaQuery as useMediaQuery } from "@material-ui/core/useMediaQuery"
import { Account } from "./context/accounts"
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

export { ObservedAccountData, ObservedRecentTxs, ObservedTradingPair }

export const useIsMobile = () => useMediaQuery("(max-width:600px)")

export const useIsSmallMobile = () => useMediaQuery("(max-width:400px)")

// TODO: Should probably be stored in context
const horizonLivenet = new Server("https://stellar-horizon.satoshipay.io/")
const horizonTestnet = new Server("https://stellar-horizon-testnet.satoshipay.io/")

export function useHorizon(testnet: boolean = false) {
  return testnet ? horizonTestnet : horizonLivenet
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
    [accountIDs.join(","), testnet]
  )

  return useDataSubscriptions(accountSubscriptions)
}

export function useAccountData(accountID: string, testnet: boolean): ObservedAccountData {
  return useAccountDataSet([accountID], testnet)[0]
}

export function useAccountOffers(accountID: string, testnet: boolean): ObservedAccountOffers {
  const horizon = useHorizon(testnet)

  const offersSubscription = React.useMemo(() => subscribeToAccountOffers(horizon, accountID), [accountID, testnet])

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
    [accounts]
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
    getAssetCacheKey(selling),
    getAssetCacheKey(buying)
  ])

  return useDataSubscription(ordersSubscription)
}

export function useRecentTransactions(accountID: string, testnet: boolean): ObservedRecentTxs {
  const horizon = useHorizon(testnet)
  const recentTxsSubscription = React.useMemo(() => subscribeToRecentTxs(horizon, accountID), [accountID, testnet])

  return useDataSubscription(recentTxsSubscription)
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
