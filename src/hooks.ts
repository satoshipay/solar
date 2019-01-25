import { useContext, useEffect, useMemo, useState } from "react"
import { __RouterContext, RouteComponentProps } from "react-router"
import { Server } from "stellar-sdk"
import { subscribeToAccount, subscribeToRecentTxs, ObservedAccountData, ObservedRecentTxs } from "./lib/subscriptions"

// TODO: Should probably be stored in context
const horizonLivenet = new Server("https://stellar-horizon.satoshipay.io/")
const horizonTestnet = new Server("https://stellar-horizon-testnet.satoshipay.io/")

export function useHorizon(testnet: boolean = false) {
  return testnet ? horizonTestnet : horizonLivenet
}

// TODO: Better to separate fetch() & subscribeToUpdates(), have two useEffects()

export function useAccountData(accountID: string, testnet: boolean): ObservedAccountData {
  const horizon = useHorizon(testnet)

  // Set up subscription to remote data immediately
  const accountSubscription = useMemo(() => subscribeToAccount(horizon, accountID), [accountID, testnet])

  const [accountData, setAccountData] = useState<ObservedAccountData>(accountSubscription.getLatest())

  // Asynchronously subscribe to remote data to keep state in sync
  // `unsubscribe` will only unsubscribe state updating code, won't close remote data subscription itself
  useEffect(
    () => {
      // Some time has passed since the last `getLatest()`, so refresh
      setAccountData(accountSubscription.getLatest())

      const unsubscribe = accountSubscription.subscribe(update => setAccountData(update))
      return unsubscribe
    },
    [accountSubscription]
  )

  return accountData
}

export function useRecentTransactions(accountID: string, testnet: boolean): ObservedRecentTxs {
  const horizon = useHorizon(testnet)

  // Set up subscription to remote data immediately
  const recentTxsSubscription = useMemo(() => subscribeToRecentTxs(horizon, accountID), [accountID, testnet])

  const [recentTxs, setRecentTxs] = useState<ObservedRecentTxs>(recentTxsSubscription.getLatest())

  // Asynchronously subscribe to remote data to keep state in sync
  // `unsubscribe` will only unsubscribe state updating code, won't close remote data subscription itself
  useEffect(
    () => {
      // Some time has passed since the last `getLatest()`, so refresh
      setRecentTxs(recentTxsSubscription.getLatest())

      const unsubscribe = recentTxsSubscription.subscribe(update => setRecentTxs(update))
      return unsubscribe
    },
    [recentTxsSubscription]
  )

  return recentTxs
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
