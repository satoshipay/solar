import { useEffect, useMemo, useState } from "react"
import { Server } from "stellar-sdk"
import { subscribeToAccount, subscribeToRecentTxs, ObservedAccountData, ObservedRecentTxs } from "./lib/subscriptions"

// TODO: Should probably be stored in context
const horizonLivenet = new Server("https://stellar-horizon.satoshipay.io/")
const horizonTestnet = new Server("https://stellar-horizon-testnet.satoshipay.io/")

export function useHorizon(testnet: boolean = false) {
  return testnet ? horizonTestnet : horizonLivenet
}

export function useAccountData(accountID: string, testnet: boolean): ObservedAccountData {
  const horizon = useHorizon(testnet)

  // Set up subscription to remote data immediately
  const accountSubscription = useMemo(() => subscribeToAccount(horizon, accountID), [accountID, testnet])

  const [accountData, setAccountData] = useState<ObservedAccountData>(accountSubscription.getLatest())

  // Asynchronously subscribe to remote data subscription to keep state in sync
  // `unsubscribe` will only unsubscribe state updating code, won't close remote data subscription itself
  useEffect(() => {
    const unsubscribe = accountSubscription.subscribe(update => setAccountData(update))
    return unsubscribe
  })

  return accountData
}

export function useRecentTransactions(accountID: string, testnet: boolean): ObservedRecentTxs {
  const horizon = useHorizon(testnet)

  // Set up subscription to remote data immediately
  const recentTxsSubscription = useMemo(() => subscribeToRecentTxs(horizon, accountID), [accountID, testnet])

  const [recentTxs, setRecentTxs] = useState<ObservedRecentTxs>(recentTxsSubscription.getLatest())

  // Asynchronously subscribe to remote data subscription to keep state in sync
  // `unsubscribe` will only unsubscribe state updating code, won't close remote data subscription itself
  useEffect(() => {
    const unsubscribe = recentTxsSubscription.subscribe(update => setRecentTxs(update))
    return unsubscribe
  })

  return recentTxs
}
