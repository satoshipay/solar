import React from "react"
import { Asset, ServerApi } from "stellar-sdk"
import { Account } from "../context/accounts"
import { SubscriptionTarget } from "../lib/subscription"
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
} from "../subscriptions"
import { useDebouncedState } from "./util"
import { useHorizon } from "./stellar"

export { ObservedAccountData, ObservedRecentTxs, ObservedTradingPair }

// TODO: Better to separate fetch() & subscribeToUpdates(), have two useEffects()

function useDataSubscriptions<ObservedData>(subscriptions: Array<SubscriptionTarget<ObservedData>>): ObservedData[] {
  const [currentDataSets, setCurrentDataSets] = useDebouncedState<ObservedData[]>(
    subscriptions.map(subscription => subscription.getLatest()),
    100
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
  React.useEffect(() => {
    // Some time has passed since the last `getLatest()`, so refresh
    setCurrentDataSets(subscriptions.map(subscription => subscription.getLatest()))

    const unsubscribeHandlers = subscriptions.map((subscription, index) =>
      subscription.subscribe(update => setCurrentDataSets(prevDataSets => updateDataSets(prevDataSets, update, index)))
    )

    const unsubscribe = () => unsubscribeHandlers.forEach(unsubscribeHandler => unsubscribeHandler())
    return unsubscribe
  }, [subscriptions])

  return currentDataSets
}

function useDataSubscription<ObservedData>(subscription: SubscriptionTarget<ObservedData>): ObservedData {
  const subscriptions = React.useMemo(() => [subscription], [subscription])
  return useDataSubscriptions(subscriptions)[0]
}

export function useLiveAccountDataSet(accountIDs: string[], testnet: boolean): ObservedAccountData[] {
  const horizon = useHorizon(testnet)
  const accountSubscriptions = React.useMemo(
    () => accountIDs.map(accountID => subscribeToAccount(horizon, accountID)),
    [accountIDs.join(","), horizon]
  )

  return useDataSubscriptions(accountSubscriptions)
}

export function useLiveAccountData(accountID: string, testnet: boolean): ObservedAccountData {
  return useLiveAccountDataSet([accountID], testnet)[0]
}

export function useLiveAccountOffers(accountID: string, testnet: boolean): ObservedAccountOffers {
  const horizon = useHorizon(testnet)

  const offersSubscription = React.useMemo(() => subscribeToAccountOffers(horizon, accountID), [accountID, horizon])

  return useDataSubscription(offersSubscription)
}

type EffectHandler = (account: Account, effect: ServerApi.EffectRecord) => void

export function useLiveAccountEffects(accounts: Account[], handler: EffectHandler) {
  const mainnetHorizon = useHorizon(false)
  const testnetHorizon = useHorizon(true)

  return React.useEffect(() => {
    const unsubscribeHandlers = accounts.map(account => {
      const horizon = account.testnet ? testnetHorizon : mainnetHorizon
      const subscription = subscribeToAccountEffects(horizon, account.publicKey)
      const unsubscribe = subscription.subscribe(effect => effect && handler(account, effect))
      return unsubscribe
    })

    return () => unsubscribeHandlers.forEach(unsubscribe => unsubscribe())
  }, [accounts, mainnetHorizon, testnetHorizon])
}

export function useLiveOrderbook(selling: Asset, buying: Asset, testnet: boolean): ObservedTradingPair {
  const horizon = useHorizon(testnet)

  const ordersSubscription = React.useMemo(() => subscribeToOrders(horizon, selling, buying), [
    horizon,
    getAssetCacheKey(selling),
    getAssetCacheKey(buying)
  ])

  return useDataSubscription(ordersSubscription)
}

export function useLiveRecentTransactions(accountID: string, testnet: boolean): ObservedRecentTxs {
  const horizon = useHorizon(testnet)
  const recentTxsSubscription = React.useMemo(() => subscribeToRecentTxs(horizon, accountID), [accountID, horizon])

  return useDataSubscription(recentTxsSubscription)
}
