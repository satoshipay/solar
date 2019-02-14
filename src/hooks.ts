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

function useDataSubscription<ObservedData>(subscription: SubscriptionTarget<ObservedData>): ObservedData {
  const [currentData, setCurrentData] = useState<ObservedData>(subscription.getLatest())

  // Asynchronously subscribe to remote data to keep state in sync
  // `unsubscribe` will only unsubscribe state updating code, won't close remote data subscription itself
  useEffect(
    () => {
      // Some time has passed since the last `getLatest()`, so refresh
      setCurrentData(subscription.getLatest())

      const unsubscribe = subscription.subscribe(update => setCurrentData(update))
      return unsubscribe
    },
    [subscription]
  )

  return currentData
}

export function useAccountData(accountID: string, testnet: boolean): ObservedAccountData {
  const horizon = useHorizon(testnet)
  const accountSubscription = useMemo(() => subscribeToAccount(horizon, accountID), [accountID, testnet])

  return useDataSubscription(accountSubscription)
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
