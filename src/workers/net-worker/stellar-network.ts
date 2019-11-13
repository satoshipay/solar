// -> subscribe to account (watch effects) + unsubscribe
// -> fetch account data
// -> fetch past txs

// Outbound API:
//   Live data:
//     -> subscribe to account data
//     -> subscribe to past txs
//     -> subscribe to open orders
//     -> subscribe to DEX orderbook
//   Static data:
//     -> fetch account data
//     -> fetch ledger data

import throttle from "lodash.throttle"
import { Server, ServerApi, Asset } from "stellar-sdk"
import { Observable, multicast } from "@andywer/observable-fns"
import { waitForAccountData } from "../../lib/account"
import { stringifyAsset } from "../../lib/stellar"

type AccountRecord = Omit<ServerApi.AccountRecord, "_links">

const accountSubscriptionCache = new Map<string, Observable<AccountRecord>>()
const effectsSubscriptionCache = new Map<string, Observable<ServerApi.EffectRecord>>()
const orderbookSubscriptionCache = new Map<string, Observable<ServerApi.OrderbookRecord>>()
const ordersSubscriptionCache = new Map<string, Observable<ServerApi.OfferRecord>>()
const transactionsSubscriptionCache = new Map<string, Observable<ServerApi.TransactionRecord>>()

const accountDataCache = new Map<string, AccountRecord>()

const createAccountCacheKey = (horizonURL: string, accountID: string) => `${horizonURL}:${accountID}`
const createOrderbookCacheKey = (horizonURL: string, selling: Asset, buying: Asset) =>
  `${horizonURL}:${stringifyAsset(selling)}:${stringifyAsset(buying)}`
const doNothing = () => undefined as void

function cachify<T, Args extends any[]>(
  cache: Map<string, Observable<T>>,
  subscribe: (...args: Args) => Observable<T>,
  createCacheKey: (...args: Args) => string
) {
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

function subscribeToAccountEffectsUncached(horizonURL: string, accountID: string) {
  const cacheKey = createAccountCacheKey(horizonURL, accountID)
  const horizon = new Server(horizonURL)

  return multicast(
    new Observable<ServerApi.EffectRecord>(observer => {
      let cancelled = false
      let latestCursor: string | undefined

      let unsubscribe = () => {
        cancelled = true
      }

      const setup = async () => {
        const { accountData: initialAccountData } = await waitForAccountData(horizon, accountID)
        accountDataCache.set(cacheKey, initialAccountData)

        if (cancelled) {
          return
        }

        const subscribe = () => {
          return horizon
            .effects()
            .forAccount(accountID)
            .cursor(latestCursor || "now")
            .stream({
              onerror(error) {
                unsubscribe()
                // tslint:disable-next-line no-console
                console.warn("Account effects stream saw an error:", error)

                // TODO: Propagate errors, but take care to be not too noisy

                delayReconnect().then(
                  () => {
                    unsubscribe = subscribe()
                  },
                  unexpectedError => {
                    observer.error(unexpectedError)
                  }
                )
              },
              onmessage: ((effect: ServerApi.EffectRecord) => {
                latestCursor = effect.paging_token
                observer.next(effect)

                // TODO: If effect is deletion of the watched account, then unsubscribe & remove cache item
              }) as any // FIXME: Update stellar-sdk to version with fixed types
            })
        }

        const delayReconnect = createReconnectDelay({ delay: 1000 })

        unsubscribe = subscribe()
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

export function subscribeToAccountUncached(horizonURL: string, accountID: string) {
  const cacheKey = createAccountCacheKey(horizonURL, accountID)
  const horizon = new Server(horizonURL)

  return multicast(
    new Observable<AccountRecord>(observer => {
      let cancelled = false
      let latestKnownSnapshot = ""

      let unsubscribe = () => {
        cancelled = true
      }

      const update = throttle(
        async () => {
          const accountData = await horizon.loadAccount(accountID)
          const snapshot = JSON.stringify(accountData)

          if (snapshot !== latestKnownSnapshot) {
            accountDataCache.set(cacheKey, accountData)
            observer.next(accountData)
            latestKnownSnapshot = snapshot
          }
        },
        250,
        { leading: true, trailing: true }
      )

      const setup = async () => {
        const lastKnownAccountData = accountDataCache.get(cacheKey)

        if (lastKnownAccountData) {
          observer.next(lastKnownAccountData)
        } else {
          // This is basically handled by subscribeToAccountEffects() already, BUT this way we get an up-to-date dataset immediately
          const { accountData: initialAccountData } = await waitForAccountData(horizon, accountID)
          observer.next(initialAccountData)
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

export function subscribeToAccountTransactionsUncached(horizonURL: string, accountID: string, cursor: string) {
  const horizon = new Server(horizonURL)

  return multicast(
    new Observable<ServerApi.TransactionRecord>(observer => {
      let latestCursor = cursor

      let unsubscribe = doNothing

      const update = async () => {
        const page = await horizon
          .transactions()
          .forAccount(accountID)
          .cursor(latestCursor)
          .call()

        if (page.records.length > 0) {
          latestCursor = page.records[page.records.length - 1].paging_token
          page.records.forEach(tx => observer.next(tx))
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

export function subscribeToOpenOrdersUncached(horizonURL: string, accountID: string, cursor: string) {
  const horizon = new Server(horizonURL)

  return multicast(
    new Observable<ServerApi.OfferRecord>(observer => {
      let latestCursor = cursor

      let unsubscribe = doNothing

      const update = async () => {
        const page = await horizon
          .offers("accounts", accountID)
          .cursor(latestCursor)
          .call()

        if (page.records.length > 0) {
          latestCursor = page.records[page.records.length - 1].paging_token
          page.records.forEach(order => observer.next(order))
        }
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

export function subscribeToOrderbookUncached(horizonURL: string, selling: Asset, buying: Asset) {
  const horizon = new Server(horizonURL)

  return multicast(
    new Observable<ServerApi.OrderbookRecord>(observer => {
      let unsubscribe = doNothing
      let latestKnownSnapshot = ""

      const setup = async () => {
        const handleUpdate = (record: ServerApi.OrderbookRecord) => {
          const snapshot = JSON.stringify(record)

          if (snapshot !== latestKnownSnapshot) {
            observer.next(record)
            latestKnownSnapshot = snapshot
          }
        }
        const handleError = (error: any) => {
          unsubscribe()
          // tslint:disable-next-line no-console
          console.warn(`Orderbook record stream ${selling.getCode()}->${buying.getCode()} saw an error:`, error)

          // TODO: Propagate errors, but take care to be not too noisy

          delayReconnect().then(
            () => {
              unsubscribe = subscribe()
            },
            unexpectedError => {
              observer.error(unexpectedError)
            }
          )
        }
        const subscribe = () => {
          horizon
            .orderbook(selling, buying)
            .call()
            .then(handleUpdate, handleError)

          return horizon
            .orderbook(selling, buying)
            .cursor("now")
            .stream({
              onerror(error) {
                handleError(error)
              },
              onmessage: (record: ServerApi.OrderbookRecord) => {
                observer.next(record)
              }
            })
        }

        const delayReconnect = createReconnectDelay({ delay: 1000 })

        unsubscribe = subscribe()
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

export function fetchAccountTransactions(horizonURL: string, accountID: string, options: PaginationOptions = {}) {
  const horizon = new Server(horizonURL)
  let call = horizon.transactions().forAccount(accountID)

  if (options.cursor) {
    call = call.cursor(options.cursor)
  }

  return call
    .limit(options.limit || 20)
    .order(options.order || "asc")
    .call()
}
