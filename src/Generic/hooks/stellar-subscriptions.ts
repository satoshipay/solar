// tslint:disable:no-shadowed-variable

import { unsubscribe, ObservableLike } from "observable-fns"
import React from "react"
import { Asset, Horizon, ServerApi } from "stellar-sdk"
import { Account } from "~App/context/accounts"
import { createEmptyAccountData, AccountData } from "../lib/account"
import { FixedOrderbookRecord } from "../lib/orderbook"
import { stringifyAsset } from "../lib/stellar"
import { mapSuspendables } from "../lib/suspense"
import { CollectionPage } from "~Workers/net-worker/stellar-network"
import {
  accountDataCache,
  accountOpenOrdersCache,
  accountTransactionsCache,
  orderbookCache,
  resetNetworkCaches,
  TransactionHistory
} from "./_caches"
import { useHorizonURL } from "./stellar"
import { useDebouncedState, useForceRerender } from "./util"
import { useNetWorker } from "./workers"

function useDataSubscriptions<DataT, UpdateT>(
  reducer: (prev: DataT, update: UpdateT) => DataT,
  items: Array<{ get(): DataT; set(value: DataT): void; observe(): ObservableLike<UpdateT> }>
): DataT[] {
  const unfinishedFetches: Array<Promise<DataT>> = []
  const [, setRefreshCounter] = useDebouncedState(0, 100)

  const currentDataSets = mapSuspendables(items, item => item.get())

  if (unfinishedFetches.length > 0) {
    throw unfinishedFetches.length === 1 ? unfinishedFetches[0] : Promise.all(unfinishedFetches)
  }

  React.useEffect(() => {
    const subscriptions = items.map(item => {
      return item.observe().subscribe({
        next(update) {
          item.set(reducer(item.get(), update))
          setRefreshCounter(counter => counter + 1)
        },
        error(error) {
          // tslint:disable-next-line
          console.error(error)
        }
      })
    })

    return () => subscriptions.forEach(subscription => unsubscribe(subscription))
  }, [reducer, items, setRefreshCounter])

  return currentDataSets as DataT[]
}

function useDataSubscription<DataT, UpdateT>(
  reducer: (prev: DataT, update: UpdateT) => DataT,
  get: () => DataT,
  set: (value: DataT) => void,
  observe: () => ObservableLike<UpdateT>
): DataT {
  const items = React.useMemo(() => [{ get, set, observe }], [get, set, observe])
  return useDataSubscriptions(reducer, items)[0]
}

function applyAccountDataUpdate(prev: AccountData, next: AccountData): AccountData {
  // We ignore `prev` here
  return next
}

export function useLiveAccountDataSet(accountIDs: string[], testnet: boolean): AccountData[] {
  const horizonURL = useHorizonURL(testnet)
  const netWorker = useNetWorker()

  const items = React.useMemo(
    () =>
      accountIDs.map(accountID => {
        const selector = [horizonURL, accountID] as const
        const prepare = (account: Horizon.AccountResponse | null) => {
          return account ? { ...account, data_attr: account.data } : createEmptyAccountData(accountID)
        }

        return {
          get() {
            return (
              accountDataCache.get(selector) ||
              accountDataCache.suspend(selector, () => netWorker.fetchAccountData(horizonURL, accountID).then(prepare))
            )
          },
          set(updated: AccountData) {
            accountDataCache.set(selector, updated)
          },
          observe() {
            return accountDataCache.observe(selector, () =>
              netWorker.subscribeToAccount(horizonURL, accountID).map(prepare)
            )
          }
        }
      }),
    [accountIDs, horizonURL, netWorker]
  )

  return useDataSubscriptions(applyAccountDataUpdate, items)
}

export function useLiveAccountData(accountID: string, testnet: boolean): AccountData {
  return useLiveAccountDataSet([accountID], testnet)[0]
}

function applyAccountOffersUpdate(
  prev: ServerApi.OfferRecord[],
  next: ServerApi.OfferRecord[]
): ServerApi.OfferRecord[] {
  // We ignore `prev` here
  return next
}

export function useLiveAccountOffers(accountID: string, testnet: boolean): ServerApi.OfferRecord[] {
  const horizonURL = useHorizonURL(testnet)
  const netWorker = useNetWorker()

  const { get, set, observe } = React.useMemo(() => {
    const selector = [horizonURL, accountID] as const
    return {
      get() {
        return (
          accountOpenOrdersCache.get(selector) ||
          accountOpenOrdersCache.suspend(selector, async () => {
            const page = await netWorker.fetchAccountOpenOrders(horizonURL, accountID)
            return page._embedded.records
          })
        )
      },
      set(updated: ServerApi.OfferRecord[]) {
        accountOpenOrdersCache.set(selector, updated)
      },
      observe() {
        return netWorker.subscribeToOpenOrders(horizonURL, accountID)
      }
    }
  }, [accountID, horizonURL, netWorker])

  return useDataSubscription(applyAccountOffersUpdate, get, set, observe)
}

type EffectHandler = (account: Account, effect: ServerApi.EffectRecord) => void

export function useLiveAccountEffects(accounts: Account[], handler: EffectHandler) {
  const netWorker = useNetWorker()
  const mainnetHorizonURL = useHorizonURL(false)
  const testnetHorizonURL = useHorizonURL(true)

  React.useEffect(() => {
    const subscriptions = accounts.map(account => {
      const horizonURL = account.testnet ? testnetHorizonURL : mainnetHorizonURL
      const observable = netWorker.subscribeToAccountEffects(horizonURL, account.publicKey)
      const subscription = observable.subscribe(effect => effect && handler(account, effect))
      return subscription
    })

    return () => subscriptions.forEach(subscription => subscription.unsubscribe())
  }, [accounts, handler, mainnetHorizonURL, netWorker, testnetHorizonURL])
}

function applyOrderbookUpdate(prev: FixedOrderbookRecord, next: FixedOrderbookRecord) {
  // Ignoring `prev` here
  return next
}

export function useLiveOrderbook(selling: Asset, buying: Asset, testnet: boolean): FixedOrderbookRecord {
  const horizonURL = useHorizonURL(testnet)
  const netWorker = useNetWorker()

  const { get, set, observe } = React.useMemo(() => {
    const selector = [horizonURL, selling, buying] as const
    return {
      get() {
        return (
          orderbookCache.get(selector) ||
          orderbookCache.suspend(selector, () =>
            netWorker.fetchOrderbookRecord(horizonURL, stringifyAsset(selling), stringifyAsset(buying))
          )
        )
      },
      set(updated: FixedOrderbookRecord) {
        orderbookCache.set(selector, updated)
      },
      observe() {
        return netWorker.subscribeToOrderbook(horizonURL, stringifyAsset(selling), stringifyAsset(buying))
      }
    }
  }, [buying, horizonURL, netWorker, selling])

  return useDataSubscription(applyOrderbookUpdate, get, set, observe)
}

const txsMatch = (a: Horizon.TransactionResponse, b: Horizon.TransactionResponse): boolean => {
  return a.source_account === b.source_account && a.source_account_sequence === b.source_account_sequence
}

function applyAccountTransactionsUpdate(
  prev: TransactionHistory,
  update: Horizon.TransactionResponse
): TransactionHistory {
  if (prev.transactions.some(tx => txsMatch(tx, update))) {
    return prev
  } else {
    return {
      ...prev,
      transactions: [update, ...prev.transactions]
    }
  }
}

export function useLiveRecentTransactions(accountID: string, testnet: boolean): TransactionHistory {
  const horizonURL = useHorizonURL(testnet)
  const netWorker = useNetWorker()

  const { get, set, observe } = React.useMemo(() => {
    const limit = 15
    const selector = [horizonURL, accountID] as const

    return {
      get() {
        return (
          accountTransactionsCache.get(selector) ||
          accountTransactionsCache.suspend(selector, async () => {
            const page = await netWorker.fetchAccountTransactions(horizonURL, accountID, {
              emptyOn404: true,
              limit,
              order: "desc"
            })

            const transactions = page._embedded.records
            return {
              // not an accurate science right now…
              olderTransactionsAvailable: transactions.length === limit,
              transactions
            }
          })
        )
      },
      set(updated: TransactionHistory) {
        accountTransactionsCache.set(selector, updated)
      },
      observe() {
        return netWorker.subscribeToAccountTransactions(horizonURL, accountID)
      }
    }
  }, [accountID, horizonURL, netWorker])

  return useDataSubscription(applyAccountTransactionsUpdate, get, set, observe)
}

export function useOlderTransactions(accountID: string, testnet: boolean) {
  const forceRerender = useForceRerender()
  const horizonURL = useHorizonURL(testnet)
  const netWorker = useNetWorker()

  const fetchMoreTransactions = React.useCallback(
    async function fetchMoreTransactions() {
      let fetched: CollectionPage<Horizon.TransactionResponse>

      const selector = [horizonURL, accountID] as const
      const history = accountTransactionsCache.get(selector)

      const limit = 15
      const prevTransactions = history?.transactions || []

      if (prevTransactions.length > 0) {
        fetched = await netWorker.fetchAccountTransactions(horizonURL, accountID, {
          emptyOn404: true,
          cursor: prevTransactions[prevTransactions.length - 1].paging_token,
          limit: 15,
          order: "desc"
        })
      } else {
        fetched = await netWorker.fetchAccountTransactions(horizonURL, accountID, {
          emptyOn404: true,
          limit,
          order: "desc"
        })
      }

      const fetchedTransactions: Horizon.TransactionResponse[] = fetched._embedded.records

      accountTransactionsCache.set(
        selector,
        {
          // not an accurate science right now…
          olderTransactionsAvailable: fetchedTransactions.length === limit,
          transactions: [
            ...(accountTransactionsCache.get(selector)?.transactions || []),
            ...fetchedTransactions.filter(record => !prevTransactions.some(prevTx => txsMatch(prevTx, record)))
          ]
        },
        true
      )

      // hacky…
      forceRerender()
    },
    [accountID, forceRerender, horizonURL, netWorker]
  )

  return fetchMoreTransactions
}

export function useNetworkCacheReset() {
  return resetNetworkCaches
}
