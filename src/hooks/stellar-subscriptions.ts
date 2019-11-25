// tslint:disable:no-shadowed-variable

import React from "react"
import { Asset, Horizon, ServerApi, Transaction } from "stellar-sdk"
import { Observable } from "@andywer/observable-fns"
import { Account } from "../context/accounts"
import { createEmptyAccountData, AccountData } from "../lib/account"
import { FixedOrderbookRecord } from "../lib/orderbook"
import { stringifyAsset } from "../lib/stellar"
import { accountDataCache, accountOpenOrdersCache, accountTransactionsCache, orderbookCache } from "./_caches"
import {
  deserializeTx,
  fetchAccountData,
  fetchAccountOpenOrders,
  fetchAccountTransactions,
  fetchOrderbookRecord,
  subscribeToAccount,
  subscribeToAccountEffects,
  subscribeToAccountTransactions,
  subscribeToOpenOrders,
  subscribeToOrderbook
} from "./_horizon"
import { useHorizon } from "./stellar"
import { useDebouncedState } from "./util"

function useDataSubscriptions<DataT, UpdateT>(
  reducer: (prev: DataT, update: UpdateT) => DataT,
  items: Array<{ get(): DataT; set(value: DataT): void; observe(): Observable<UpdateT> }>
): DataT[] {
  const unfinishedFetches: Array<Promise<DataT>> = []
  const [, setRefreshCounter] = useDebouncedState(0, 100)

  const currentDataSets = items.map(item => {
    try {
      return item.get()
    } catch (thrown) {
      if (thrown instanceof Promise) {
        unfinishedFetches.push(thrown)
      } else {
        throw thrown
      }
    }
  })

  if (unfinishedFetches.length > 0) {
    throw unfinishedFetches.length === 1 ? unfinishedFetches[0] : Promise.all(unfinishedFetches)
  }

  React.useEffect(() => {
    const subscriptions = items.map(item => {
      return item.observe().subscribe(update => {
        item.set(reducer(item.get(), update))
        setRefreshCounter(counter => counter + 1)
      })
    })

    return () => subscriptions.forEach(subscription => subscription.unsubscribe())
  }, [reducer, items])

  return currentDataSets as DataT[]
}

function useDataSubscription<DataT, UpdateT>(
  reducer: (prev: DataT, update: UpdateT) => DataT,
  get: () => DataT,
  set: (value: DataT) => void,
  observe: () => Observable<UpdateT>
): DataT {
  const items = React.useMemo(() => [{ get, set, observe }], [get, set, observe])
  return useDataSubscriptions(reducer, items)[0]
}

function applyAccountDataUpdate(prev: AccountData, next: AccountData): AccountData {
  return next.paging_token > prev.paging_token ? next : prev
}

export function useLiveAccountDataSet(accountIDs: string[], testnet: boolean): AccountData[] {
  const horizon = useHorizon(testnet)

  const items = React.useMemo(
    () =>
      accountIDs.map(accountID => {
        const selector = [horizon, accountID] as const
        const prepare = (account: Horizon.AccountResponse | null) => {
          return account ? { ...account, data_attr: account.data } : createEmptyAccountData(accountID)
        }

        return {
          get() {
            return (
              accountDataCache.get(selector) ||
              accountDataCache.suspend(selector, () => fetchAccountData(horizon, accountID).then(prepare))
            )
          },
          set(updated: AccountData) {
            accountDataCache.set(selector, updated)
          },
          observe() {
            return accountDataCache.observe(selector, () => subscribeToAccount(horizon, accountID).map(prepare))
          }
        }
      }),
    [accountIDs.join(","), horizon]
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
  const horizon = useHorizon(testnet)

  const { get, set, observe } = React.useMemo(() => {
    const selector = [horizon, accountID] as const
    return {
      get() {
        return (
          accountOpenOrdersCache.get(selector) ||
          accountOpenOrdersCache.suspend(selector, async () => {
            const page = await fetchAccountOpenOrders(horizon, accountID)
            return page._embedded.records
          })
        )
      },
      set(updated: ServerApi.OfferRecord[]) {
        accountOpenOrdersCache.set(selector, updated)
      },
      observe() {
        return subscribeToOpenOrders(horizon, accountID)
      }
    }
  }, [accountID, horizon])

  return useDataSubscription(applyAccountOffersUpdate, get, set, observe)
}

type EffectHandler = (account: Account, effect: ServerApi.EffectRecord) => void

export function useLiveAccountEffects(accounts: Account[], handler: EffectHandler) {
  const mainnetHorizon = useHorizon(false)
  const testnetHorizon = useHorizon(true)

  React.useEffect(() => {
    const subscriptions = accounts.map(account => {
      const horizon = account.testnet ? testnetHorizon : mainnetHorizon
      const observable = subscribeToAccountEffects(horizon, account.publicKey)
      const subscription = observable.subscribe(effect => effect && handler(account, effect))
      return subscription
    })

    return () => subscriptions.forEach(subscription => subscription.unsubscribe())
  }, [accounts, mainnetHorizon, testnetHorizon])
}

function applyOrderbookUpdate(prev: FixedOrderbookRecord, next: FixedOrderbookRecord) {
  // Ignoring `prev` here
  return next
}

export function useLiveOrderbook(selling: Asset, buying: Asset, testnet: boolean): FixedOrderbookRecord {
  const horizon = useHorizon(testnet)

  const { get, set, observe } = React.useMemo(() => {
    const selector = [horizon, selling, buying] as const
    return {
      get() {
        return (
          orderbookCache.get(selector) ||
          orderbookCache.suspend(selector, () => fetchOrderbookRecord(horizon, selling, buying))
        )
      },
      set(updated: FixedOrderbookRecord) {
        orderbookCache.set(selector, updated)
      },
      observe() {
        return subscribeToOrderbook(horizon, selling, buying)
      }
    }
  }, [horizon, stringifyAsset(selling), stringifyAsset(buying)])

  return useDataSubscription(applyOrderbookUpdate, get, set, observe)
}

const createAccountTransactionsUpdateReducer = (testnet: boolean) => (
  prev: Transaction[],
  update: Horizon.TransactionResponse
) => {
  if (prev.some(tx => `${tx.source}:${tx.sequence}` === `${update.source_account}:${update.source_account_sequence}`)) {
    return prev
  } else {
    return [deserializeTx(update, testnet), ...prev]
  }
}

export function useLiveRecentTransactions(accountID: string, testnet: boolean): Transaction[] {
  const horizon = useHorizon(testnet)

  const applyAccountTransactionsUpdate = React.useMemo(() => createAccountTransactionsUpdateReducer(testnet), [testnet])

  const { get, set, observe } = React.useMemo(() => {
    const selector = [horizon, accountID] as const
    return {
      get() {
        return (
          accountTransactionsCache.get(selector) ||
          accountTransactionsCache.suspend(selector, async () => {
            const page = await fetchAccountTransactions(horizon, accountID, { limit: 15, order: "desc" })
            const txs = page._embedded.records.map(record => deserializeTx(record, testnet))
            return txs
          })
        )
      },
      set(updated: Transaction[]) {
        accountTransactionsCache.set(selector, updated)
      },
      observe() {
        return subscribeToAccountTransactions(horizon, accountID)
      }
    }
  }, [accountID, horizon])

  return useDataSubscription(applyAccountTransactionsUpdate, get, set, observe)
}
