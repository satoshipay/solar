import { Asset, Horizon, Server, Transaction } from "stellar-sdk"
import { multicast, Observable } from "@andywer/observable-fns"
import { AccountData } from "../lib/account"
import { FixedOrderbookRecord } from "../lib/orderbook"
import { stringifyAsset } from "../lib/stellar"
import { max } from "../lib/strings"
import { OrdersPage } from "./_horizon"

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
      const cached = cache.get(selector)

      if (!cached || isDataNewer(cached, value)) {
        values.set(createCacheKey(selector), value)
      }
    },
    suspend(selector: SelectorT, fetcher: () => Promise<DataT>): never {
      const cacheKey = createCacheKey(selector)
      let loading = fetchs.get(cacheKey)

      if (!loading) {
        loading = fetcher().then(value => {
          cache.set(selector, value)
          return value
        })
        fetchs.set(cacheKey, loading)
      }

      // React Suspense: Throw the loading promise, so React knows we are waiting
      throw loading
    },
    observe(selector: SelectorT, observe: () => Observable<UpdateT>) {
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

function createAccountCacheKey([horizon, accountID]: readonly [Server, string]) {
  return `${horizon.serverURL}:${accountID}`
}

function createAssetPairCacheKey([horizon, selling, buying]: readonly [Server, Asset, Asset]) {
  return `${horizon.serverURL}:${stringifyAsset(selling)}:${stringifyAsset(buying)}`
}

function areTransactionsNewer(prev: Transaction[], next: Transaction[]) {
  const prevMaxTimestamp = (prev ? max(prev.map(tx => getTxCreatedAt(tx)), "0") : undefined) || ""
  const nextMaxTimestamp = max(next.map(tx => getTxCreatedAt(tx)), "0") || ""

  return !prev || nextMaxTimestamp > prevMaxTimestamp
}

export const accountDataCache = createCache<readonly [Server, string], AccountData, AccountData>(
  createAccountCacheKey,
  (prev, next) => next.paging_token > prev.paging_token
)

export const accountOpenOrdersCache = createCache<readonly [Server, string], OrdersPage, OrdersPage>(
  createAccountCacheKey
)

export const accountTransactionsCache = createCache<
  readonly [Server, string],
  Transaction[],
  Horizon.TransactionResponse
>(createAccountCacheKey, areTransactionsNewer)

export const orderbookCache = createCache<readonly [Server, Asset, Asset], FixedOrderbookRecord, FixedOrderbookRecord>(
  createAssetPairCacheKey
)
