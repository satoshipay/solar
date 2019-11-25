import "eventsource"
import PromiseQueue from "p-queue"
import qs from "qs"
import { Asset, Horizon, ServerApi } from "stellar-sdk"
import { map, Observable } from "@andywer/observable-fns"
import pkg from "../../../package.json"
import { Cancellation } from "../../lib/errors"
import { parseAssetID } from "../../lib/stellar"
import { max } from "../../lib/strings"
import { createReconnectingSSE } from "../_util/event-source"
import { parseJSONResponse } from "../_util/rest"
import { subscribeToUpdatesAndPoll } from "../_util/subscription"

export interface CollectionPage<T> {
  _embedded: {
    records: T[]
  }
  _links: {
    self: {
      href: string
    }
    next: {
      href: string
    }
    prev: {
      href: string
    }
  }
}

const accountSubscriptionCache = new Map<string, Observable<Horizon.AccountResponse>>()
const effectsSubscriptionCache = new Map<string, Observable<ServerApi.EffectRecord>>()
const orderbookSubscriptionCache = new Map<string, Observable<ServerApi.OrderbookRecord>>()
const ordersSubscriptionCache = new Map<string, Observable<ServerApi.OfferRecord[]>>()
const transactionsSubscriptionCache = new Map<string, Observable<Horizon.TransactionResponse>>()

const accountDataCache = new Map<string, Horizon.AccountResponse | null>()
const accountDataWaitingCache = new Map<string, ReturnType<typeof waitForAccountDataUncached>>()

// Limit the number of concurrent fetches
const fetchQueue = new PromiseQueue({ concurrency: 8 })

const identification = {
  "X-Client-Name": "Solar",
  "X-Client-Version": pkg.version
}

const createAccountCacheKey = (horizonURL: string, accountID: string) => `${horizonURL}:${accountID}`
const createOrderbookCacheKey = (horizonURL: string, sellingAsset: string, buyingAsset: string) =>
  `${horizonURL}:${sellingAsset}:${buyingAsset}`

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function cachify<T, Args extends any[]>(
  cache: Map<string, Observable<T>>,
  subscribe: (...args: Args) => Observable<T>,
  createCacheKey: (...args: Args) => string
): (...args: Args) => Observable<T> {
  return (...args: Args) => {
    const cacheKey = createCacheKey(...args)
    const cached = cache.get(cacheKey)

    if (cached) {
      return cached
    } else {
      const observable = subscribe(...args)
      cache.set(cacheKey, observable)
      return observable
    }
  }
}

async function waitForAccountDataUncached(horizonURL: string, accountID: string, shouldCancel?: () => boolean) {
  let accountData = null
  let interval = 2500
  let initialFetchFailed = false

  while (true) {
    if (shouldCancel && shouldCancel()) {
      throw Cancellation("Stopping to wait for account to become present in network.")
    }

    const url = new URL(`/accounts/${accountID}`, horizonURL)
    const response = await fetch(String(url) + "?" + qs.stringify(identification))

    if (response.status === 200) {
      accountData = await parseJSONResponse<Horizon.AccountResponse>(response)
      break
    } else if (response.status === 404) {
      initialFetchFailed = true
      await delay(interval)
    } else {
      throw Error(`Request to ${response.url} failed with status ${response.status}`)
    }

    // Slowly increase polling interval up to some not-too-high maximum
    interval = Math.min(interval * 1.05, 7000)
  }

  return {
    accountData,
    initialFetchFailed
  }
}

async function waitForAccountData(horizonURL: string, accountID: string, shouldCancel?: () => boolean) {
  // Cache promise to make sure we don't poll the same account twice simultaneously
  const cacheKey = createAccountCacheKey(horizonURL, accountID)
  const pending = accountDataWaitingCache.get(cacheKey)

  if (pending) {
    return pending
  } else {
    const justStarted = waitForAccountDataUncached(horizonURL, accountID, shouldCancel)
    accountDataWaitingCache.set(cacheKey, justStarted)
    justStarted.then(() => accountDataWaitingCache.delete(cacheKey), () => accountDataWaitingCache.delete(cacheKey))
    return justStarted
  }
}

function subscribeToAccountEffectsUncached(horizonURL: string, accountID: string) {
  let latestCursor: string | undefined
  let latestEffectCreatedAt: string | undefined

  return subscribeToUpdatesAndPoll<ServerApi.EffectRecord>(
    {
      async applyUpdate(update) {
        latestCursor = update.paging_token
        latestEffectCreatedAt = update.created_at
        return update
      },
      async fetchUpdate(streamedUpdate) {
        if (streamedUpdate) {
          return streamedUpdate
        } else {
          const effect = await fetchLatestAccountEffect(horizonURL, accountID)
          return effect || undefined
        }
      },
      async init() {
        const effect = await fetchLatestAccountEffect(horizonURL, accountID)

        latestCursor = effect ? effect.paging_token : latestCursor
        latestEffectCreatedAt = effect ? effect.created_at : latestEffectCreatedAt

        return effect || undefined
      },
      shouldApplyUpdate(update) {
        return (
          !latestEffectCreatedAt || (update.created_at >= latestEffectCreatedAt && update.paging_token !== latestCursor)
        )
      },
      subscribeToUpdates() {
        const createURL = () =>
          String(new URL(`/accounts/${accountID}/effects?cursor=${latestCursor || "now"}`, horizonURL))

        return new Observable<ServerApi.EffectRecord>(observer => {
          return createReconnectingSSE(createURL, {
            onMessage(message) {
              const effect: ServerApi.EffectRecord = JSON.parse(message.data)
              latestCursor = effect.paging_token
              observer.next(effect)
            },
            onUnexpectedError(error) {
              observer.error(error)
            }
          })
        })
      }
    },
    {
      retryFetchOnNoUpdate: false
    }
  )
}

export const subscribeToAccountEffects = cachify(
  effectsSubscriptionCache,
  subscribeToAccountEffectsUncached,
  createAccountCacheKey
)

function subscribeToAccountUncached(horizonURL: string, accountID: string) {
  let latestSequenceNo: string | undefined

  const cacheKey = createAccountCacheKey(horizonURL, accountID)

  return subscribeToUpdatesAndPoll<Horizon.AccountResponse | null>({
    async applyUpdate(update) {
      if (update) {
        accountDataCache.set(cacheKey, update)
        latestSequenceNo = update.sequence
      }
      return update
    },
    async fetchUpdate() {
      const accountData = await fetchAccountData(horizonURL, accountID)
      return accountData || undefined
    },
    async init() {
      const lastKnownAccountData = accountDataCache.get(cacheKey)

      if (lastKnownAccountData) {
        latestSequenceNo = lastKnownAccountData.sequence
        return lastKnownAccountData
      } else {
        const { accountData: initialAccountData } = await waitForAccountData(horizonURL, accountID)

        accountDataCache.set(cacheKey, initialAccountData)
        latestSequenceNo = initialAccountData.sequence

        return initialAccountData
      }
    },
    shouldApplyUpdate(update) {
      return Boolean(update && (!latestSequenceNo || update.sequence > latestSequenceNo))
    },
    subscribeToUpdates() {
      return map(subscribeToAccountEffects(horizonURL, accountID), () => fetchAccountData(horizonURL, accountID))
    }
  })
}

export const subscribeToAccount = cachify(accountSubscriptionCache, subscribeToAccountUncached, createAccountCacheKey)

function subscribeToAccountTransactionsUncached(horizonURL: string, accountID: string) {
  let latestCreatedAt: string | undefined
  let latestCursor: string | undefined

  const fetchUpdate = async () => {
    const page = await fetchAccountTransactions(horizonURL, accountID, {
      cursor: latestCursor,
      limit: 15,
      order: "desc"
    })
    return page._embedded.records
  }

  return subscribeToUpdatesAndPoll<Horizon.TransactionResponse[]>({
    async applyUpdate(update) {
      const prevLatestCreatedAt = latestCreatedAt

      if (update.length > 0) {
        latestCreatedAt = max(update.map(tx => tx.created_at), "0")
        latestCursor = update.find(tx => tx.created_at === latestCreatedAt)!.paging_token
      }
      return update.filter(tx => !prevLatestCreatedAt || tx.created_at > prevLatestCreatedAt)
    },
    fetchUpdate,
    async init() {
      await waitForAccountData(horizonURL, accountID)
      return fetchUpdate()
    },
    shouldApplyUpdate(update) {
      return update.length > 0 && (!latestCreatedAt || update[0].created_at > latestCreatedAt)
    },
    subscribeToUpdates() {
      return map(subscribeToAccountEffects(horizonURL, accountID), () => fetchUpdate())
    }
  }).flatMap((txs: Horizon.TransactionResponse[]) => Observable.from(txs))
}

export const subscribeToAccountTransactions = cachify(
  transactionsSubscriptionCache,
  subscribeToAccountTransactionsUncached,
  createAccountCacheKey
)

function subscribeToOpenOrdersUncached(horizonURL: string, accountID: string) {
  let latestCursor: string | undefined
  let latestSetEmpty = false

  const fetchUpdate = async () => {
    const page = await fetchAccountOpenOrders(horizonURL, accountID, { cursor: latestCursor })
    return page._embedded.records
  }

  return subscribeToUpdatesAndPoll<ServerApi.OfferRecord[]>({
    async applyUpdate(update) {
      if (update.length > 0) {
        const latestID = max(update.map(offer => String(offer.id)), "0")
        latestCursor = update.find(offer => String(offer.id) === latestID)!.paging_token
      }

      latestSetEmpty = update.length === 0
      return update
    },
    fetchUpdate,
    async init() {
      const records = await fetchUpdate()

      if (records.length > 0) {
        latestCursor = records[0].paging_token
      }

      return records
    },
    shouldApplyUpdate(update) {
      const latestUpdateCursor = max(update.map(record => record.paging_token), "0")
      const emptySet = !latestUpdateCursor
      return emptySet !== latestSetEmpty || (!emptySet && latestUpdateCursor !== latestCursor)
    },
    subscribeToUpdates() {
      return map(subscribeToAccountEffects(horizonURL, accountID), () => fetchUpdate())
    }
  })
}

export const subscribeToOpenOrders = cachify(
  ordersSubscriptionCache,
  subscribeToOpenOrdersUncached,
  createAccountCacheKey
)

function createOrderbookQuery(selling: Asset, buying: Asset) {
  const query: any = { limit: 100 }

  query.buying_asset_type = buying.getAssetType()
  query.selling_asset_type = selling.getAssetType()

  if (!buying.isNative()) {
    query.buying_asset_code = buying.getCode()
    query.buying_asset_issuer = buying.getIssuer()
  }
  if (!selling.isNative()) {
    query.selling_asset_code = selling.getCode()
    query.selling_asset_issuer = selling.getIssuer()
  }

  return query
}

function subscribeToOrderbookUncached(horizonURL: string, sellingAsset: string, buyingAsset: string) {
  const buying = parseAssetID(buyingAsset)
  const selling = parseAssetID(sellingAsset)
  const query = createOrderbookQuery(selling, buying)

  const createURL = () => String(new URL(`/order_book?${qs.stringify({ ...query, cursor: "now" })}`, horizonURL))
  const fetchUpdate = () => fetchOrderbookRecord(horizonURL, sellingAsset, buyingAsset)

  let latestKnownSnapshot = ""

  // TODO: Optimize - Make UpdateT = ValueT & { [$snapshot]: string }

  return subscribeToUpdatesAndPoll({
    async applyUpdate(update) {
      latestKnownSnapshot = JSON.stringify(update)
      return update
    },
    fetchUpdate,
    async init() {
      const record = await fetchUpdate()
      latestKnownSnapshot = JSON.stringify(record)
      return record
    },
    shouldApplyUpdate(update) {
      const snapshot = JSON.stringify(update)
      return snapshot !== latestKnownSnapshot
    },
    subscribeToUpdates() {
      return new Observable<ServerApi.OrderbookRecord>(observer => {
        return createReconnectingSSE(createURL, {
          onMessage(message) {
            const record: ServerApi.OrderbookRecord = JSON.parse(message.data)
            observer.next(record)
          },
          onUnexpectedError(error) {
            observer.error(error)
          }
        })
      })
    }
  })
}

export const subscribeToOrderbook = cachify(
  orderbookSubscriptionCache,
  subscribeToOrderbookUncached,
  createOrderbookCacheKey
)

export interface PaginationOptions {
  cursor?: string
  limit?: number
  order?: "asc" | "desc"
}

export async function fetchAccountData(horizonURL: string, accountID: string) {
  const url = new URL(`/accounts/${accountID}`, horizonURL)
  const response = await fetchQueue.add(() => fetch(String(url) + "?" + qs.stringify(identification)), { priority: 0 })

  if (response.status === 404) {
    return null
  }

  return parseJSONResponse<Horizon.AccountResponse>(response)
}

export async function fetchLatestAccountEffect(horizonURL: string, accountID: string) {
  const url = new URL(`/accounts/${accountID}/effects`, horizonURL)
  const response = await fetchQueue.add(
    () =>
      fetch(
        String(url) +
          "?" +
          qs.stringify({
            ...identification,
            limit: 1,
            order: "desc"
          })
      ),
    { priority: 2 }
  )

  if (response.status === 404) {
    return null
  }

  return parseJSONResponse<ServerApi.EffectRecord>(response)
}

export async function fetchAccountTransactions(horizonURL: string, accountID: string, options: PaginationOptions = {}) {
  const url = new URL(`/accounts/${accountID}/transactions`, horizonURL)
  const response = await fetchQueue.add(
    () => fetch(String(url) + "?" + qs.stringify({ ...identification, ...options })),
    { priority: 1 }
  )

  return parseJSONResponse<CollectionPage<Horizon.TransactionResponse>>(response)
}

export async function fetchAccountOpenOrders(horizonURL: string, accountID: string, options: PaginationOptions = {}) {
  const url = new URL(`/accounts/${accountID}/offers`, horizonURL)
  const response = await fetchQueue.add(
    () => fetch(String(url) + "?" + qs.stringify({ ...identification, ...options })),
    { priority: 1 }
  )

  return parseJSONResponse<CollectionPage<ServerApi.OfferRecord>>(response)
}

export async function fetchOrderbookRecord(horizonURL: string, sellingAsset: string, buyingAsset: string) {
  const query = createOrderbookQuery(parseAssetID(sellingAsset), parseAssetID(buyingAsset))
  const url = new URL(`/order_book}`, horizonURL)
  const response = await fetchQueue.add(
    () => fetch(String(url) + "?" + qs.stringify({ ...identification, ...query })),
    { priority: 1 }
  )

  return parseJSONResponse<ServerApi.OrderbookRecord>(response)
}
