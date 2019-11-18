import "eventsource"
import throttle from "lodash.throttle"
import PromiseQueue from "p-queue"
import qs from "qs"
import { Horizon, ServerApi, Asset } from "stellar-sdk"
import { Observable, multicast } from "@andywer/observable-fns"
import pkg from "../../../package.json"
import { Cancellation } from "../../lib/errors"
import { parseAssetID } from "../../lib/stellar"
import { max } from "../../lib/strings"
import { parseJSONResponse } from "../_util/rest"

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
const ordersSubscriptionCache = new Map<string, Observable<CollectionPage<ServerApi.OfferRecord>>>()
const transactionsSubscriptionCache = new Map<string, Observable<Horizon.TransactionResponse>>()

const accountDataCache = new Map<string, Horizon.AccountResponse | null>()

// Limit the number of concurrent fetches
const fetchQueue = new PromiseQueue({ concurrency: 8 })

const identification = {
  "X-Client-Name": "Solar",
  "X-Client-Version": pkg.version
}

const createAccountCacheKey = (horizonURL: string, accountID: string) => `${horizonURL}:${accountID}`
const createOrderbookCacheKey = (horizonURL: string, sellingAsset: string, buyingAsset: string) =>
  `${horizonURL}:${sellingAsset}:${buyingAsset}`
const doNothing = () => undefined as void

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

function createReconnectDelay(options: { delay: number }): () => Promise<void> {
  let lastConnectionAttemptTime = 0

  const networkBackOnline = () => {
    if (navigator.onLine === false) {
      return new Promise(resolve => {
        window.addEventListener("online", resolve, { once: true, passive: true })
      })
    } else {
      return Promise.resolve()
    }
  }

  const timeReached = (waitUntil: number) => {
    const timeToWait = waitUntil - Date.now()
    return timeToWait > 0 ? new Promise(resolve => setTimeout(resolve, timeToWait)) : Promise.resolve()
  }

  return async function delayReconnect() {
    const justConnectedBefore = Date.now() - lastConnectionAttemptTime < options.delay
    const waitUntil = Date.now() + options.delay

    await networkBackOnline()

    if (justConnectedBefore) {
      // Reconnect immediately (skip await) if last reconnection is long ago
      await timeReached(waitUntil)
    }

    lastConnectionAttemptTime = Date.now()
  }
}

async function waitForAccountData(horizonURL: string, accountID: string, shouldCancel?: () => boolean) {
  let accountData = null
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
      await delay(2500)
    } else {
      throw Error(`Request to ${response.url} failed with status ${response.status}`)
    }
  }

  return {
    accountData,
    initialFetchFailed
  }
}

function subscribeToAccountEffectsUncached(horizonURL: string, accountID: string) {
  const cacheKey = createAccountCacheKey(horizonURL, accountID)

  return multicast(
    new Observable<ServerApi.EffectRecord>(observer => {
      let cancelled = false
      let latestCursor: string | undefined
      let latestMessageTime = 0

      let eventSource: EventSource | undefined
      let watchdogTimeout: any

      const unsubscribe = () => {
        cancelled = true

        clearTimeout(watchdogTimeout)
        if (eventSource) {
          eventSource.close()
        }
      }

      const setup = async () => {
        // TODO: Would make more sense to fetch the last effect

        const { accountData: initialAccountData } = await fetchQueue.add(() =>
          waitForAccountData(horizonURL, accountID)
        )
        accountDataCache.set(cacheKey, initialAccountData)

        if (cancelled) {
          return
        }

        const url = new URL(`/accounts/${accountID}/effects`, horizonURL)

        const resetWatchdog = () => {
          watchdogTimeout = setTimeout(() => {
            if (Date.now() - latestMessageTime > 15_000) {
              unsubscribe()
              subscribe()
            } else {
              resetWatchdog()
            }
          }, 15_000)
        }

        const subscribe = () => {
          eventSource = new EventSource(
            String(url) +
              "?" +
              qs.stringify({
                ...identification,
                cursor: latestCursor || "now"
              })
          )

          eventSource.onmessage = message => {
            const effect: ServerApi.EffectRecord = JSON.parse(message.data)
            latestCursor = effect.paging_token
            latestMessageTime = Date.now()
            observer.next(effect)
          }
          eventSource.onerror = errorMessage => {
            unsubscribe()

            // tslint:disable-next-line no-console
            console.warn("Account effects stream saw an error:", errorMessage)

            // TODO: Propagate errors, but take care to be not too noisy

            delayReconnect().then(
              () => subscribe(),
              unexpectedError => {
                observer.error(unexpectedError)
              }
            )
          }
        }

        const delayReconnect = createReconnectDelay({ delay: 1000 })
        subscribe()
      }

      setup().catch(error => observer.error(error))

      // Do not shorten to `return unsubscribe`, as we always want to call the current `unsubscribe`
      return () => unsubscribe()
    })
  )
}

export const subscribeToAccountEffects = cachify(
  effectsSubscriptionCache,
  subscribeToAccountEffectsUncached,
  createAccountCacheKey
)

function subscribeToAccountUncached(horizonURL: string, accountID: string) {
  const cacheKey = createAccountCacheKey(horizonURL, accountID)

  return multicast(
    new Observable<Horizon.AccountResponse | null>(observer => {
      let cancelled = false
      let latestCursor: string | undefined

      let unsubscribe = () => {
        cancelled = true
      }

      const update = throttle(
        async () => {
          const accountData = await fetchQueue.add(() => fetchAccountData(horizonURL, accountID))

          if (accountData && (!latestCursor || accountData.paging_token > latestCursor)) {
            accountDataCache.set(cacheKey, accountData)
            observer.next(accountData)
            latestCursor = accountData.paging_token
          }
        },
        250,
        { leading: true, trailing: true }
      )

      const setup = async () => {
        const lastKnownAccountData = accountDataCache.get(cacheKey)

        if (lastKnownAccountData) {
          observer.next(lastKnownAccountData)
          latestCursor = lastKnownAccountData.paging_token
        } else {
          // This is basically handled by subscribeToAccountEffects() already, BUT this way we get an up-to-date dataset immediately
          const { accountData: initialAccountData } = await waitForAccountData(horizonURL, accountID)
          observer.next(initialAccountData)
          latestCursor = initialAccountData.paging_token
        }

        if (cancelled) {
          return
        }

        const subscription = subscribeToAccountEffects(horizonURL, accountID).subscribe(
          () => {
            // tslint:disable-next-line no-console
            update().catch(error => console.error(`Account data update of ${accountID} failed:`, error))
          },
          error => observer.error(error),
          () => observer.complete()
        )

        unsubscribe = () => subscription.unsubscribe()
      }

      setup().catch(error => observer.error(error))

      // Do not shorten to `return unsubscribe`, as we always want to call the current `unsubscribe`
      return () => unsubscribe()
    })
  )
}

export const subscribeToAccount = cachify(accountSubscriptionCache, subscribeToAccountUncached, createAccountCacheKey)

function subscribeToAccountTransactionsUncached(horizonURL: string, accountID: string, cursor: string) {
  return multicast(
    new Observable<Horizon.TransactionResponse>(observer => {
      let latestCursor = cursor

      let unsubscribe = doNothing

      const update = async () => {
        const page = await fetchAccountTransactions(horizonURL, accountID, { cursor: latestCursor, limit: 15 })
        const { records } = page._embedded

        if (records.length > 0) {
          latestCursor = records[records.length - 1].paging_token
          records.forEach(tx => observer.next(tx))
        }
      }

      const setup = async () => {
        const subscription = subscribeToAccountEffects(horizonURL, accountID).subscribe(
          () => {
            // tslint:disable-next-line no-console
            update().catch(error => console.error(`Account transactions update of ${accountID} failed:`, error))
          },
          error => observer.error(error),
          () => observer.complete()
        )

        unsubscribe = () => subscription.unsubscribe()
      }

      setup().catch(error => observer.error(error))

      // Do not shorten to `return unsubscribe`, as we always want to call the current `unsubscribe`
      return () => unsubscribe()
    })
  )
}

export const subscribeToAccountTransactions = cachify(
  transactionsSubscriptionCache,
  subscribeToAccountTransactionsUncached,
  createAccountCacheKey
)

function subscribeToOpenOrdersUncached(horizonURL: string, accountID: string, cursor: string) {
  return multicast(
    new Observable<CollectionPage<ServerApi.OfferRecord>>(observer => {
      let latestCursor = cursor
      let unsubscribe = doNothing

      const update = async () => {
        const page = await fetchAccountOpenOrders(horizonURL, accountID, { cursor: latestCursor })
        latestCursor = max(page._embedded.records.map(record => record.paging_token)) || latestCursor
        observer.next(page)
      }

      const setup = async () => {
        const subscription = subscribeToAccountEffects(horizonURL, accountID).subscribe(
          () => {
            // tslint:disable-next-line no-console
            update().catch(error => console.error(`Account open orders update of ${accountID} failed:`, error))
          },
          error => observer.error(error),
          () => observer.complete()
        )

        unsubscribe = () => subscription.unsubscribe()
      }

      setup().catch(error => observer.error(error))

      // Do not shorten to `return unsubscribe`, as we always want to call the current `unsubscribe`
      return () => unsubscribe()
    })
  )
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

  return multicast(
    new Observable<ServerApi.OrderbookRecord>(observer => {
      let latestKnownSnapshot = ""
      let latestMessageTime = 0

      let eventSource: EventSource | undefined
      let watchdogTimeout: any

      const query = createOrderbookQuery(selling, buying)
      const url = new URL(`/order_book?${qs.stringify({ ...query, cursor: "now" })}`, horizonURL)

      const unsubscribe = () => {
        clearTimeout(watchdogTimeout)
        if (eventSource) {
          eventSource.close()
        }
      }

      const setup = async () => {
        const handleUpdate = (record: ServerApi.OrderbookRecord) => {
          const snapshot = JSON.stringify(record)

          if (snapshot !== latestKnownSnapshot) {
            observer.next(record)
            latestKnownSnapshot = snapshot
          }

          latestMessageTime = Date.now()
        }
        const handleError = (error: any) => {
          unsubscribe()
          // tslint:disable-next-line no-console
          console.warn(`Orderbook record stream ${selling.getCode()}->${buying.getCode()} saw an error:`, error)

          // TODO: Propagate errors, but take care to be not too noisy

          delayReconnect().then(
            () => subscribe(),
            unexpectedError => {
              observer.error(unexpectedError)
            }
          )
        }
        const resetWatchdog = () => {
          watchdogTimeout = setTimeout(() => {
            if (Date.now() - latestMessageTime > 15_000) {
              unsubscribe()
              subscribe()
            } else {
              resetWatchdog()
            }
          }, 15_000)
        }
        const subscribe = () => {
          eventSource = new EventSource(`${url}?${qs.stringify(query)}`)

          eventSource.onmessage = message => {
            const record: ServerApi.OrderbookRecord = JSON.parse(message.data)
            handleUpdate(record)
          }
          eventSource.onerror = handleError
        }

        const delayReconnect = createReconnectDelay({ delay: 1000 })
        subscribe()
      }

      setup().catch(error => observer.error(error))

      // Do not shorten to `return unsubscribe`, as we always want to call the current `unsubscribe`
      return () => unsubscribe()
    })
  )
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
  const response = await fetch(String(url) + "?" + qs.stringify(identification))

  if (response.status === 404) {
    return null
  }

  return parseJSONResponse<Horizon.AccountResponse>(response)
}

export async function fetchAccountTransactions(horizonURL: string, accountID: string, options: PaginationOptions = {}) {
  const url = new URL(`/accounts/${accountID}/transactions`, horizonURL)
  const response = await fetch(String(url) + "?" + qs.stringify({ ...identification, ...options }))

  return parseJSONResponse<CollectionPage<Horizon.TransactionResponse>>(response)
}

export async function fetchAccountOpenOrders(horizonURL: string, accountID: string, options: PaginationOptions = {}) {
  const url = new URL(`/accounts/${accountID}/offers`, horizonURL)
  const response = await fetch(String(url) + "?" + qs.stringify({ ...identification, ...options }))

  return parseJSONResponse<CollectionPage<ServerApi.OfferRecord>>(response)
}

export async function fetchOrderbookRecord(horizonURL: string, sellingAsset: string, buyingAsset: string) {
  const query = createOrderbookQuery(parseAssetID(sellingAsset), parseAssetID(buyingAsset))
  const url = new URL(`/order_book}`, horizonURL)
  const response = await fetch(String(url) + "?" + qs.stringify({ ...identification, ...query }))

  return parseJSONResponse<ServerApi.OrderbookRecord>(response)
}
