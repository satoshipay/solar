/* tslint:disable:no-string-literal */

import * as JWT from "jsonwebtoken"
import React from "react"
import { __RouterContext, RouteComponentProps } from "react-router"
import { Asset, Server, ServerApi, StellarTomlResolver, Transaction } from "stellar-sdk"
import useMediaQuery from "@material-ui/core/useMediaQuery"
import * as WebAuth from "@satoshipay/stellar-sep-10"
import { Account } from "./context/accounts"
import {
  SigningKeyCacheContext,
  StellarAddressCacheContext,
  StellarAddressReverseCacheContext,
  StellarTomlCacheContext,
  StellarTomlLoadingCacheContext,
  WebAuthTokenCacheContext
} from "./context/caches"
import { NotificationsContext } from "./context/notifications"
import { StellarContext } from "./context/stellar"
import { AsyncStatus } from "./lib/async"
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
import { AccountRecord } from "./types/well-known-accounts"
import { StellarToml, StellarTomlCurrency } from "./types/stellar-toml"

export { ObservedAccountData, ObservedRecentTxs, ObservedTradingPair }

const dedupe = <T>(array: T[]) => Array.from(new Set(array))

export const useIsMobile = () => useMediaQuery("(max-width:600px)")
export const useIsSmallMobile = () => useMediaQuery("(max-width:400px)")

export function useHorizon(testnet: boolean = false) {
  const stellar = React.useContext(StellarContext)
  return testnet ? stellar.horizonTestnet : stellar.horizonLivenet
}

export function useDebouncedState<T>(initial: T, delay: number = 50): [T, (update: T | ((prev: T) => T)) => void] {
  const currentCallGroupTimeoutRef = React.useRef<any>(undefined)
  const updateQueueRef = React.useRef<Array<T | ((prev: T) => T)> | undefined>(undefined)
  const [state, setState] = React.useState(initial)

  const applyUpdateQueue = (previous: T, queue: Array<T | ((prev: T) => T)>) => {
    return queue.reduce<T>(
      (intermediate, queuedUpdate) =>
        typeof queuedUpdate === "function" ? (queuedUpdate as ((p: T) => T))(intermediate) : queuedUpdate,
      previous
    )
  }

  const debouncedSetState = React.useCallback((update: T | ((prev: T) => T)) => {
    if (currentCallGroupTimeoutRef.current) {
      updateQueueRef.current!.push(update)
    } else {
      currentCallGroupTimeoutRef.current = setTimeout(() => {
        if (updateQueueRef.current) {
          const queue = updateQueueRef.current
          setState(prev => applyUpdateQueue(prev, queue))
        }
        currentCallGroupTimeoutRef.current = undefined
        updateQueueRef.current = undefined
      }, delay)
      updateQueueRef.current = []
      setState(update)
    }
  }, [])

  React.useEffect(() => {
    const onUnmount = () => {
      if (currentCallGroupTimeoutRef.current) {
        clearTimeout(currentCallGroupTimeoutRef.current)
      }
    }
    return onUnmount
  }, [])

  return [state, debouncedSetState]
}

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
    [subscriptions]
  )

  return currentDataSets
}

function useDataSubscription<ObservedData>(subscription: SubscriptionTarget<ObservedData>): ObservedData {
  const subscriptions = React.useMemo(() => [subscription], [subscription])
  return useDataSubscriptions(subscriptions)[0]
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

type EffectHandler = (account: Account, effect: ServerApi.EffectRecord) => void

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

export interface RefStateObject {
  element: HTMLElement | null
  update: (element: HTMLElement) => void
}

export function useDialogActions(): RefStateObject {
  const [dialogActions, setDialogActions] = React.useState<HTMLElement | null>(null)
  return {
    element: dialogActions,
    update: setDialogActions
  }
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

export function useFederationLookup() {
  const lookup = React.useContext(StellarAddressCacheContext)
  const reverseLookup = React.useContext(StellarAddressReverseCacheContext)
  return {
    lookupFederationRecord(stellarAddress: string) {
      return StellarAddresses.lookupFederationRecord(stellarAddress, lookup.cache, reverseLookup.cache)
    },
    lookupStellarAddress(publicKey: string) {
      return reverseLookup.cache.get(publicKey)
    }
  }
}

export function useWebAuth() {
  const signingKeys = React.useContext(SigningKeyCacheContext)
  const webauthTokens = React.useContext(WebAuthTokenCacheContext)
  const createCacheKey = React.useCallback(
    (endpointURL: string, localPublicKey: string) => `${endpointURL}:${localPublicKey}`,
    []
  )

  return {
    fetchChallenge: WebAuth.fetchChallenge,

    async fetchWebAuthData(horizon: Server, issuerAccountID: string) {
      const metadata = await WebAuth.fetchWebAuthData(horizon, issuerAccountID)
      if (metadata) {
        signingKeys.store(metadata.signingKey, metadata.domain)
      }
      return metadata
    },

    getCachedAuthToken(endpointURL: string, localPublicKey: string) {
      return webauthTokens.cache.get(createCacheKey(endpointURL, localPublicKey))
    },

    async postResponse(endpointURL: string, transaction: Transaction) {
      const manageDataOperation = transaction.operations.find(operation => operation.type === "manageData")
      const localPublicKey = manageDataOperation ? manageDataOperation.source : undefined
      const authToken = await WebAuth.postResponse(endpointURL, transaction)

      if (localPublicKey) {
        const decoded = JWT.decode(authToken) as any
        const maxAge = decoded.exp ? Number.parseInt(decoded.exp, 10) * 1000 - Date.now() - 60_000 : undefined
        webauthTokens.store(createCacheKey(endpointURL, localPublicKey), authToken, maxAge)
      }
      return authToken
    }
  }
}

const createStellarTomlCacheKey = (domain: string) => `cache:stellar.toml:${domain}`

export function useStellarTomlFiles(domains: string[]): Map<string, [StellarToml, boolean]> {
  const stellarTomls = React.useContext(StellarTomlCacheContext)
  const loadingStates = React.useContext(StellarTomlLoadingCacheContext)
  const resultMap = new Map<string, [StellarToml, boolean]>()

  React.useEffect(
    () => {
      for (const domain of domains) {
        // This is semantically different from `.filter()`-ing above, since this will
        // prevent double-fetching from domains that were part of this iteration
        if (stellarTomls.cache.has(domain) || loadingStates.cache.has(domain)) {
          continue
        }

        loadingStates.store(domain, AsyncStatus.pending())

        StellarTomlResolver.resolve(domain)
          .then(stellarTomlData => {
            loadingStates.delete(domain)
            stellarTomls.store(domain, stellarTomlData)
            localStorage.setItem(createStellarTomlCacheKey(domain), JSON.stringify(stellarTomlData))
          })
          .catch(error => {
            loadingStates.store(domain, AsyncStatus.rejected(error))
          })
      }
    },
    [domains, loadingStates, stellarTomls]
  )

  for (const domain of domains) {
    const cached = stellarTomls.cache.get(domain)
    const loadingState = loadingStates.cache.get(domain)

    if (cached) {
      resultMap.set(domain, [cached, false])
    } else if (loadingState && loadingState.state === "rejected") {
      const persistentlyCached = localStorage.getItem(createStellarTomlCacheKey(domain))
      resultMap.set(domain, [persistentlyCached ? JSON.parse(persistentlyCached) : undefined, false])
    } else {
      const persistentlyCached = localStorage.getItem(createStellarTomlCacheKey(domain))
      resultMap.set(domain, [persistentlyCached ? JSON.parse(persistentlyCached) : undefined, true])
    }
  }

  return resultMap
}

export function useStellarToml(domain: string | null | undefined): [StellarToml | undefined, boolean] {
  const tomlFiles = useStellarTomlFiles(domain ? [domain] : [])
  return domain ? tomlFiles.get(domain)! : [undefined, false]
}

export function useAssetMetadata(assets: Asset[], testnet: boolean) {
  const issuerAccountIDs = dedupe(assets.filter(asset => !asset.isNative()).map(asset => asset.getIssuer()))
  const accountDataSet = useAccountDataSet(issuerAccountIDs, testnet)

  const domains = accountDataSet
    .filter(accountData => accountData.home_domain)
    .map(accountData => accountData.home_domain!)

  const resultMap = new WeakMap<Asset, [StellarTomlCurrency | undefined, boolean]>()
  const stellarTomlFiles = useStellarTomlFiles(domains)

  for (const asset of assets) {
    const assetCode = asset.isNative() ? undefined : asset.getCode()
    const issuerAccountID = asset.isNative() ? undefined : asset.getIssuer()
    const accountData = issuerAccountID
      ? accountDataSet.find(someAccountData => someAccountData.id === issuerAccountID)
      : undefined
    const domain = accountData ? accountData.home_domain : undefined
    const [stellarTomlData, loading] = domain ? stellarTomlFiles.get(domain)! : [undefined, false]

    const assetMetadata =
      stellarTomlData && stellarTomlData["CURRENCIES"] && Array.isArray(stellarTomlData["CURRENCIES"])
        ? stellarTomlData["CURRENCIES"].find(
            (currency: any) => currency.code === assetCode && currency.issuer === issuerAccountID
          )
        : undefined

    resultMap.set(asset, [assetMetadata, loading])
  }

  return resultMap
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

export function useWellKnownAccounts() {
  const [loadingState, setLoadingState] = React.useState<AsyncStatus<AccountRecord[]>>(AsyncStatus.pending())

  React.useEffect(() => {
    const cachedAccountsString = localStorage.getItem("known-accounts")
    const timestamp = localStorage.getItem("timestamp")
    if (cachedAccountsString && timestamp && +timestamp > Date.now() - 24 * 60 * 60 * 1000) {
      // use cached accounts if they are not older than 24h
      const accounts = JSON.parse(cachedAccountsString)
      setLoadingState(AsyncStatus.resolved(accounts))
    } else {
      fetch("https://api.stellar.expert/api/explorer/public/directory").then(async response => {
        if (response.status >= 400) {
          setLoadingState(
            AsyncStatus.rejected(new Error(`Bad response (${response.status}) from stellar.expert server`))
          )
        }

        try {
          const json = await response.json()
          const knownAccounts = json._embedded.records as AccountRecord[]
          localStorage.setItem("known-accounts", JSON.stringify(knownAccounts))
          localStorage.setItem("timestamp", Date.now().toString())
          setLoadingState(AsyncStatus.resolved(knownAccounts))
        } catch (error) {
          setLoadingState(AsyncStatus.rejected(error))
        }
      })
    }
  }, [])

  return {
    lookup(publicKey: string): AccountRecord | undefined {
      if (loadingState.state === "resolved") {
        const accounts = loadingState.data
        return accounts.find(account => account.address === publicKey)
      } else {
        return undefined
      }
    }
  }
}
