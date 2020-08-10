import { TransferServerInfo } from "@satoshipay/stellar-transfer"
import { multicast, Observable, ObservableLike } from "observable-fns"
import { Asset, Horizon, ServerApi } from "stellar-sdk"
import { trackError } from "~App/contexts/notifications"
import { AccountData } from "../lib/account"
import { FixedOrderbookRecord } from "../lib/orderbook"
import { stringifyAsset } from "../lib/stellar"
import { AccountRecord } from "../lib/stellar-expert"
import { AssetRecord } from "../lib/stellar-ticker"
import { max } from "../lib/strings"

function createCache<SelectorT, DataT, UpdateT>(
  createCacheKey: (selector: SelectorT) => string,
  isDataNewer: (prev: DataT, next: DataT) => boolean = () => true
) {
  const values = new Map<string, DataT>()
  const fetchs = new Map<string, Promise<DataT>>()
  const errors = new Map<string, Error>()
  const observables = new Map<string, Observable<UpdateT>>()

  const cache = {
    clear() {
      values.clear()
    },
    get(selector: SelectorT) {
      return values.get(createCacheKey(selector))
    },
    has(selector: SelectorT) {
      return values.has(createCacheKey(selector))
    },
    set(selector: SelectorT, value: DataT, force: boolean = false) {
      const cacheKey = createCacheKey(selector)
      const cached = values.get(cacheKey)

      if (!value) {
        throw Error(
          "Trying to set a cache item value to something falsy. " +
            "This will break `cache.get() || cache.suspend()` calls to the cache."
        )
      }

      if (!cached || isDataNewer(cached, value) || force) {
        values.set(cacheKey, value)
      }
    },
    suspend(selector: SelectorT, fetcher: () => Promise<DataT>): never {
      const cacheKey = createCacheKey(selector)
      let loading = fetchs.get(cacheKey)

      if (errors.has(cacheKey)) {
        // Important to re-throw the error synchronously, so it gets caught by the next
        // error boundary, not React.Suspense, to prevent endless re-render loops
        throw errors.get(cacheKey)
      }

      if (!loading) {
        loading = fetcher().then(
          value => {
            cache.set(selector, value)
            return value
          },
          error => {
            errors.set(cacheKey, error)
            trackError(error)
            throw error
          }
        )
        fetchs.set(cacheKey, loading)
      }

      // React Suspense: Throw the loading promise, so React knows we are waiting
      throw loading
    },
    observe(selector: SelectorT, observe: () => ObservableLike<UpdateT>) {
      const cacheKey = createCacheKey(selector)
      const cached = observables.get(cacheKey)

      if (cached) {
        return cached
      } else {
        // Multicast it, so we re-use the existing subscription
        // instead of setting up listeners over and over again
        const multicasted = multicast(observe())
        // TODO: Check if this value is actually newer than the old one
        observables.set(cacheKey, multicasted)
        return multicasted
      }
    }
  }
  return cache
}

function createAccountCacheKey([horizonURL, accountID]: readonly [string, string]) {
  return `${horizonURL}:${accountID}`
}

function createAssetPairCacheKey([horizonURL, selling, buying]: readonly [string, Asset, Asset]) {
  return `${horizonURL}:${stringifyAsset(selling)}:${stringifyAsset(buying)}`
}

export interface TransactionHistory {
  olderTransactionsAvailable: boolean
  transactions: Horizon.TransactionResponse[]
}

export interface OfferHistory {
  olderOffersAvailable: boolean
  offers: ServerApi.OfferRecord[]
}

function areTransactionsNewer(prev: TransactionHistory, next: TransactionHistory) {
  const prevMaxTimestamp =
    (prev
      ? max(
          prev.transactions.map(tx => tx.created_at),
          "0"
        )
      : undefined) || ""
  const nextMaxTimestamp =
    max(
      next.transactions.map(tx => tx.created_at),
      "0"
    ) || ""

  return !prev || nextMaxTimestamp > prevMaxTimestamp
}

function areOffersNewer(prev: OfferHistory, next: OfferHistory) {
  const prevMaxTimestamp =
    (prev
      ? max(
          prev.offers.map(tx => tx.last_modified_time),
          "0"
        )
      : undefined) || ""
  const nextMaxTimestamp =
    max(
      next.offers.map(tx => tx.last_modified_time),
      "0"
    ) || ""

  return !prev || nextMaxTimestamp > prevMaxTimestamp
}

export const accountDataCache = createCache<readonly [string, string], AccountData, AccountData>(createAccountCacheKey)

export const accountHomeDomainCache = createCache<readonly [string, string], [string] | [], AccountData["home_domain"]>(
  createAccountCacheKey
)

export const accountOpenOrdersCache = createCache<readonly [string, string], OfferHistory, ServerApi.OfferRecord[]>(
  createAccountCacheKey,
  areOffersNewer
)

export const accountTransactionsCache = createCache<
  readonly [string, string],
  TransactionHistory,
  Horizon.TransactionResponse
>(createAccountCacheKey, areTransactionsNewer)

export const orderbookCache = createCache<readonly [string, Asset, Asset], FixedOrderbookRecord, FixedOrderbookRecord>(
  createAssetPairCacheKey
)

// Storing the array [isPresent, stellarTomlData] is important for distinguishing between
// "the data has not yet been fetched" and "we fetched, but the site doesn't provide any data"
export const stellarTomlCache = createCache<string, [boolean, any], any>(domain => domain)

export const transferInfosCache = createCache<string, [TransferServerInfo] | [], TransferServerInfo>(domain => domain)
export const tickerAssetsCache = createCache<boolean, AssetRecord[], AssetRecord[]>(testnet =>
  testnet ? "testnet" : "pubnet"
)
export const wellKnownAccountsCache = createCache<boolean, AccountRecord[], AccountRecord[]>(testnet =>
  testnet ? "testnet" : "pubnet"
)

export function resetNetworkCaches() {
  accountDataCache.clear()
  accountOpenOrdersCache.clear()
  accountTransactionsCache.clear()
  orderbookCache.clear()
}
