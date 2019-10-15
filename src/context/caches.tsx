import debounce from "lodash.debounce"
import LRUCache from "lru-cache"
import React from "react"
import { FederationServer } from "stellar-sdk"
import { useSingleton } from "../hooks/util"
import { AccountData } from "../lib/account"
import { FetchState } from "../lib/async"
import { AccountRecord, fetchWellknownAccounts } from "../lib/stellar-expert"
import { AssetRecord, fetchAllAssets } from "../lib/stellar-ticker"

// Just to make the cache types more readable
type CacheKey = string
type Domain = string
type JWT = string
type PublicKey = string
type StellarAddress = string

interface CacheContextType<K, V> {
  cache: LRUCache<K, V>
  delete(key: K): void
  store(key: K, value: V, maxAge?: number): void
}

export type SigningKeyContextType = CacheContextType<PublicKey, Domain>
export type StellarAccountDataContextType = CacheContextType<PublicKey, FetchState<AccountData>>
export type StellarAddressContextType = CacheContextType<StellarAddress, FederationServer.Record>
export type StellarAddressReverseContextType = CacheContextType<PublicKey, StellarAddress>
export type StellarTomlContextType = CacheContextType<Domain, FetchState<any>>
export type WebAuthTokenContextType = CacheContextType<CacheKey, JWT>

export interface TickerAssetsContextType {
  mainnet: () => AssetRecord[]
  testnet: () => AssetRecord[]
}

export interface WellknownAccountsContextType {
  mainnet: () => AccountRecord[]
  testnet: () => AccountRecord[]
}

function useCachingContext<K, V>(cache: LRUCache<K, V>): CacheContextType<K, V> {
  // Little hack to force propagating updates
  const [counter, setUpdateCounter] = React.useState(0)
  const forceRerender = debounce(() => setUpdateCounter(ctr => ctr + 1), 50)

  const contextValue = React.useMemo<CacheContextType<K, V>>(
    () => ({
      cache,
      delete(key) {
        cache.del(key)
        forceRerender()
      },
      store(key, value, maxAge?: number) {
        cache.set(key, value, maxAge)
        forceRerender()
      }
    }),
    [cache, counter]
  )
  return contextValue
}

const emptyContextValue: CacheContextType<any, any> = {
  cache: new LRUCache(),
  delete: () => undefined,
  store: () => undefined
}

export const SigningKeyCacheContext = React.createContext<SigningKeyContextType>(emptyContextValue)
export const StellarAccountDataCacheContext = React.createContext<StellarAccountDataContextType>(emptyContextValue)
export const StellarAddressCacheContext = React.createContext<StellarAddressContextType>(emptyContextValue)
export const StellarAddressReverseCacheContext = React.createContext<StellarAddressReverseContextType>(
  emptyContextValue
)
export const StellarTomlCacheContext = React.createContext<StellarTomlContextType>(emptyContextValue)
export const WebAuthTokenCacheContext = React.createContext<WebAuthTokenContextType>(emptyContextValue)

export const TickerAssetsCacheContext = React.createContext<TickerAssetsContextType>({
  mainnet: () => [],
  testnet: () => []
})

export const WellknownAccountsCacheContext = React.createContext<WellknownAccountsContextType>({
  mainnet: () => [],
  testnet: () => []
})

interface Props {
  children: React.ReactNode
}

export function SigningKeyCachingProvider(props: Props) {
  const cache = useSingleton(
    () =>
      new LRUCache<PublicKey, Domain>({
        max: 100
      })
  )
  const contextValue = useCachingContext(cache)
  return <SigningKeyCacheContext.Provider value={contextValue}>{props.children}</SigningKeyCacheContext.Provider>
}

export function StellarAccountDataCachingProvider(props: Props) {
  const cache = useSingleton(
    () =>
      new LRUCache<PublicKey, FetchState<AccountData>>({
        max: 1000,
        maxAge: 10 * 60 * 1000 // 10 mins
      })
  )
  const contextValue = useCachingContext(cache)
  return (
    <StellarAccountDataCacheContext.Provider value={contextValue}>
      {props.children}
    </StellarAccountDataCacheContext.Provider>
  )
}

export function StellarAddressesCachingProvider(props: Props) {
  const cache = useSingleton(
    () =>
      new LRUCache<StellarAddress, FederationServer.Record>({
        max: 1000,
        maxAge: 10 * 60 * 1000 // 10 mins
      })
  )
  const contextValue = useCachingContext(cache)
  return (
    <StellarAddressCacheContext.Provider value={contextValue}>{props.children}</StellarAddressCacheContext.Provider>
  )
}

export function StellarAddressesReverseCachingProvider(props: Props) {
  const cache = useSingleton(
    () =>
      new LRUCache<PublicKey, StellarAddress>({
        max: 1000,
        maxAge: 60 * 60 * 1000 // 60 mins (long TTL, since reverse lookup is purely informational)
      })
  )
  const contextValue = useCachingContext(cache)
  return (
    <StellarAddressReverseCacheContext.Provider value={contextValue}>
      {props.children}
    </StellarAddressReverseCacheContext.Provider>
  )
}

export function StellarTomlCachingProvider(props: Props) {
  const cache = useSingleton(
    () =>
      new LRUCache<Domain, any>({
        max: 100
      })
  )
  const contextValue = useCachingContext(cache)
  return <StellarTomlCacheContext.Provider value={contextValue}>{props.children}</StellarTomlCacheContext.Provider>
}

export function WellknownAccountsCachingProvider(props: Props) {
  const [mainnetLoadingState, setMainnetLoadingState] = React.useState<FetchState<AccountRecord[]> | undefined>()
  const [testnetLoadingState, setTestnetLoadingState] = React.useState<FetchState<AccountRecord[]> | undefined>()

  const contextValue = React.useMemo(
    () => ({
      mainnet() {
        if (!mainnetLoadingState) {
          setMainnetLoadingState(FetchState.pending())

          fetchWellknownAccounts(false)
            .then(records => {
              setMainnetLoadingState(FetchState.resolved(records))
            })
            .catch(error => {
              // tslint:disable-next-line no-console
              console.error(error)
              setMainnetLoadingState(FetchState.rejected(error))
            })
          return []
        }
        return mainnetLoadingState.state === "resolved" ? mainnetLoadingState.data : []
      },
      testnet() {
        if (!testnetLoadingState) {
          setTestnetLoadingState(FetchState.pending())

          fetchWellknownAccounts(true)
            .then(records => {
              setTestnetLoadingState(FetchState.resolved(records))
            })
            .catch(error => {
              // tslint:disable-next-line no-console
              console.error(error)
              setTestnetLoadingState(FetchState.rejected(error))
            })
          return []
        }
        return testnetLoadingState.state === "resolved" ? testnetLoadingState.data : []
      }
    }),
    [mainnetLoadingState, testnetLoadingState]
  )

  return (
    <WellknownAccountsCacheContext.Provider value={contextValue}>
      {props.children}
    </WellknownAccountsCacheContext.Provider>
  )
}

export function TickerAssetsCachingProvider(props: Props) {
  const [mainnetLoadingState, setMainnetLoadingState] = React.useState<FetchState<AssetRecord[]> | undefined>()
  const [testnetLoadingState, setTestnetLoadingState] = React.useState<FetchState<AssetRecord[]> | undefined>()

  const contextValue = React.useMemo(
    () => ({
      mainnet() {
        if (!mainnetLoadingState) {
          setMainnetLoadingState(FetchState.pending())

          fetchAllAssets(false)
            .then(assets => {
              setMainnetLoadingState(FetchState.resolved(assets))
            })
            .catch(error => {
              // tslint:disable-next-line no-console
              console.error(error)
              setMainnetLoadingState(FetchState.rejected(error))
            })
          return []
        }
        return mainnetLoadingState.state === "resolved" ? mainnetLoadingState.data : []
      },
      testnet() {
        if (!testnetLoadingState) {
          setTestnetLoadingState(FetchState.pending())

          fetchAllAssets(true)
            .then(assets => {
              setTestnetLoadingState(FetchState.resolved(assets))
            })
            .catch(error => {
              // tslint:disable-next-line no-console
              console.error(error)
              setTestnetLoadingState(FetchState.rejected(error))
            })
          return []
        }
        return testnetLoadingState.state === "resolved" ? testnetLoadingState.data : []
      }
    }),
    [mainnetLoadingState, testnetLoadingState]
  )

  return <TickerAssetsCacheContext.Provider value={contextValue}>{props.children}</TickerAssetsCacheContext.Provider>
}

export function WebAuthCachingProvider(props: Props) {
  const cache = useSingleton(
    () =>
      new LRUCache<CacheKey, JWT>({
        max: 100
      })
  )
  const contextValue = useCachingContext(cache)
  return <WebAuthTokenCacheContext.Provider value={contextValue}>{props.children}</WebAuthTokenCacheContext.Provider>
}

export function CachingProviders(props: Props) {
  return (
    <SigningKeyCachingProvider>
      <TickerAssetsCachingProvider>
        <WellknownAccountsCachingProvider>
          <StellarAddressesCachingProvider>
            <StellarAddressesReverseCachingProvider>
              <StellarAccountDataCachingProvider>
                <StellarTomlCachingProvider>
                  <WebAuthCachingProvider>{props.children}</WebAuthCachingProvider>
                </StellarTomlCachingProvider>
              </StellarAccountDataCachingProvider>
            </StellarAddressesReverseCachingProvider>
          </StellarAddressesCachingProvider>
        </WellknownAccountsCachingProvider>
      </TickerAssetsCachingProvider>
    </SigningKeyCachingProvider>
  )
}
