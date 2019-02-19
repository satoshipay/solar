import { useContext, useEffect, useMemo, useState } from "react"
import { __RouterContext, RouteComponentProps } from "react-router"
import { Asset, Server } from "stellar-sdk"
import { SettingsContext } from "./context/settings"
import { createDeadSubscription, SubscriptionTarget } from "./lib/subscription"
import {
  getAssetCacheKey,
  subscribeToAccount,
  subscribeToAccountOffers,
  subscribeToOrders,
  subscribeToRecentTxs,
  ObservedAccountData,
  ObservedAccountOffers,
  ObservedRecentTxs,
  ObservedTradingPair
} from "./subscriptions"

export { ObservedAccountData, ObservedRecentTxs, ObservedTradingPair }

// TODO: Should probably be stored in context
const horizonLivenet = new Server("https://stellar-horizon.satoshipay.io/")
const horizonTestnet = new Server("https://stellar-horizon-testnet.satoshipay.io/")

export function useHorizon(testnet: boolean = false) {
  return testnet ? horizonTestnet : horizonLivenet
}

// TODO: Better to separate fetch() & subscribeToUpdates(), have two useEffects()

function useDataSubscriptions<ObservedData>(subscriptions: Array<SubscriptionTarget<ObservedData>>): ObservedData[] {
  const [currentDataSets, setCurrentDataSets] = useState<ObservedData[]>(
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
  useEffect(
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
    [subscriptions]
  )

  return currentDataSets
}

function useDataSubscription<ObservedData>(subscription: SubscriptionTarget<ObservedData>): ObservedData {
  return useDataSubscriptions([subscription])[0]
}

export function useAccountDataSet(accountIDs: string[], testnet: boolean): ObservedAccountData[] {
  const horizon = useHorizon(testnet)
  const accountSubscriptions = useMemo(() => accountIDs.map(accountID => subscribeToAccount(horizon, accountID)), [
    accountIDs.join(","),
    testnet
  ])

  return useDataSubscriptions(accountSubscriptions)
}

export function useAccountData(accountID: string, testnet: boolean): ObservedAccountData {
  return useAccountDataSet([accountID], testnet)[0]
}

export function useAccountOffers(accountID: string, testnet: boolean): ObservedAccountOffers {
  const horizon = useHorizon(testnet)
  const settings = useContext(SettingsContext)

  const offersSubscription = useMemo(
    () => {
      return settings.dexTrading
        ? subscribeToAccountOffers(horizon, accountID)
        : createDeadSubscription<ObservedAccountOffers>({ loading: false, offers: [] })
    },
    [accountID, testnet]
  )

  return useDataSubscription(offersSubscription)
}

export function useOrderbook(selling: Asset, buying: Asset, testnet: boolean): ObservedTradingPair {
  const horizon = useHorizon(testnet)

  const ordersSubscription = useMemo(() => subscribeToOrders(horizon, selling, buying), [
    getAssetCacheKey(selling),
    getAssetCacheKey(buying)
  ])

  return useDataSubscription(ordersSubscription)
}

export function useRecentTransactions(accountID: string, testnet: boolean): ObservedRecentTxs {
  const horizon = useHorizon(testnet)
  const recentTxsSubscription = useMemo(() => subscribeToRecentTxs(horizon, accountID), [accountID, testnet])

  return useDataSubscription(recentTxsSubscription)
}

// TODO: Get rid of this hook once react-router is shipped with a hook out-of-the-box
export function useRouter<Params = {}>() {
  const routerContext = useContext<RouteComponentProps<Params>>(__RouterContext)
  const [updateEnforcementState, setUpdateEnforcementState] = useState(0)

  const forceUpdate = () => setUpdateEnforcementState(updateEnforcementState + 1)

  if (!routerContext) {
    throw new Error("useRouter() hook can only be used within a react-router provider.")
  }

  useEffect(
    () => {
      const unsubscribe = routerContext.history.listen(() => forceUpdate())
      return unsubscribe
    },
    [routerContext]
  )

  return routerContext
}
