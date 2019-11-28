import { Asset, Horizon, ServerApi, Transaction } from "stellar-sdk"
import { multicast, Observable, ObservableLike } from "@andywer/observable-fns"
import { trackError } from "../context/notifications"
import { AccountData } from "../lib/account"
import { FixedOrderbookRecord } from "../lib/orderbook"
import { stringifyAsset } from "../lib/stellar"
import { max } from "../lib/strings"

const getTxCreatedAt = (tx: Transaction) => (tx as any).created_at as string

function createCache<SelectorT, DataT, UpdateT>(
  createCacheKey: (selector: SelectorT) => string,
  isDataNewer: (prev: DataT, next: DataT) => boolean = () => true
) {
  const values = new Map<string, DataT>()
  const fetchs = new Map<string, Promise<DataT>>()
  const observables = new Map<string, Observable<UpdateT>>()

  const cache = {
    get(selector: SelectorT) {
      return values.get(createCacheKey(selector))
    },
    set(selector: SelectorT, value: DataT) {
      const cacheKey = createCacheKey(selector)
      const cached = values.get(cacheKey)

      if (!cached || isDataNewer(cached, value)) {
        values.set(cacheKey, value)
      }
    },
    suspend(selector: SelectorT, fetcher: () => Promise<DataT>): never {
      const cacheKey = createCacheKey(selector)
      let loading = fetchs.get(cacheKey)

      if (!loading) {
        loading = fetcher().then(
          value => {
            cache.set(selector, value)
            return value
          },
          error => {
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

function areTransactionsNewer(prev: Transaction[], next: Transaction[]) {
  const prevMaxTimestamp = (prev ? max(prev.map(tx => getTxCreatedAt(tx)), "0") : undefined) || ""
  const nextMaxTimestamp = max(next.map(tx => getTxCreatedAt(tx)), "0") || ""

  return !prev || nextMaxTimestamp > prevMaxTimestamp
}

export const accountDataCache = createCache<readonly [string, string], AccountData, AccountData>(createAccountCacheKey)

export const accountOpenOrdersCache = createCache<
  readonly [string, string],
  ServerApi.OfferRecord[],
  ServerApi.OfferRecord[]
>(createAccountCacheKey)

export const accountTransactionsCache = createCache<
  readonly [string, string],
  Transaction[],
  Horizon.TransactionResponse
>(createAccountCacheKey, areTransactionsNewer)

export const orderbookCache = createCache<readonly [string, Asset, Asset], FixedOrderbookRecord, FixedOrderbookRecord>(
  createAssetPairCacheKey
)
