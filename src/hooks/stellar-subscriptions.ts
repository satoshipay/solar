// tslint:disable:no-shadowed-variable

import React from "react"
import { Asset, Horizon, ServerApi, Transaction } from "stellar-sdk"
import { Observable } from "@andywer/observable-fns"
import { Account } from "../context/accounts"
import { trackError } from "../context/notifications"
import { createEmptyAccountData, AccountData } from "../lib/account"
import { FixedOrderbookRecord } from "../lib/orderbook"
import { stringifyAsset } from "../lib/stellar"
import { accountDataCache, accountTransactionsCache } from "./_caches"
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
  subscribeToOrderbook,
  OrdersPage
} from "./_horizon"
import { useHorizon } from "./stellar"
import { useDebouncedState } from "./util"

function createEmptyOrderbookRecord(selling: Asset, buying: Asset): FixedOrderbookRecord {
  return {
    asks: [],
    base: selling,
    bids: [],
    counter: buying
  }
}

function useDataSubscriptions<DataT, UpdateT>(
  reducer: (prev: DataT, update: UpdateT) => DataT,
  items: Array<{ fetch: Promise<DataT>; initial: DataT; observable: Observable<UpdateT> }>
): DataT[] {
  const [currentDataSets, setCurrentDataSets] = useDebouncedState<DataT[]>(() => items.map(item => item.initial), 100)

  const updateDataSet = (index: number, updater: (prev: DataT) => DataT) => {
    setCurrentDataSets(allPrev => {
      const result = allPrev.map((prev, idx) => (idx === index ? updater(prev) : prev))
      return result
    })
  }

  React.useEffect(() => {
    let cancelled = false

    const subscriptions = items.map((item, index) => {
      const fetchInitialData = async () => {
        const fetched = await item.fetch
        if (!cancelled) {
          updateDataSet(index, () => fetched)
        }
      }

      fetchInitialData().catch(trackError)

      return item.observable.subscribe(update => {
        updateDataSet(index, prev => reducer(prev, update))
      })
    })

    return () => {
      cancelled = true
      subscriptions.forEach(subscription => subscription.unsubscribe())
    }
  }, [reducer, items])

  return currentDataSets
}

function useDataSubscription<DataT, UpdateT>(
  reducer: (prev: DataT, update: UpdateT) => DataT,
  initial: DataT,
  fetch: Promise<DataT>,
  observable: Observable<UpdateT>
): DataT {
  const items = React.useMemo(() => [{ fetch, initial, observable }], [fetch, initial, observable])
  return useDataSubscriptions(reducer, items)[0]
}

function applyAccountDataUpdate(prev: [AccountData, boolean], next: [AccountData, boolean]): [AccountData, boolean] {
  const [prevData] = prev
  const [nextData, nextHasLoaded] = next
  return nextHasLoaded && nextData.paging_token > prevData.paging_token ? next : prev
}

export function useLiveAccountDataSet(accountIDs: string[], testnet: boolean): Array<[AccountData, boolean]> {
  const horizon = useHorizon(testnet)

  const items = React.useMemo(
    () =>
      accountIDs.map(accountID => {
        const turnIntoResultTuple = (accountOrNull: Horizon.AccountResponse | null): [AccountData, boolean] => {
          const account = accountOrNull
            ? { ...accountOrNull, data_attr: accountOrNull.data }
            : createEmptyAccountData(accountID)
          return [account, true]
        }

        const cached = accountDataCache.get(horizon, accountID)
        const initial: [AccountData, boolean] = cached ? [cached, true] : [createEmptyAccountData(accountID), false]
        const fetch = fetchAccountData(horizon, accountID).then(turnIntoResultTuple)
        const observable = subscribeToAccount(horizon, accountID).map(turnIntoResultTuple)

        return {
          initial,
          fetch,
          observable
        }
      }),
    [accountIDs.join(","), horizon]
  )

  return useDataSubscriptions(applyAccountDataUpdate, items)
}

export function useLiveAccountData(accountID: string, testnet: boolean): [AccountData, boolean] {
  return useLiveAccountDataSet([accountID], testnet)[0]
}

function applyAccountOffersUpdate(prev: OrdersPage, next: OrdersPage): OrdersPage {
  // We ignore `prev` here
  return next
}

export function useLiveAccountOffers(accountID: string, testnet: boolean): ServerApi.OfferRecord[] {
  const horizon = useHorizon(testnet)

  const { initial, fetch, subscription } = React.useMemo(() => {
    // TODO: Cache?
    const initial: OrdersPage = { _embedded: { records: [] } }
    const fetch = fetchAccountOpenOrders(horizon, accountID)
    const subscription = subscribeToOpenOrders(horizon, accountID, "now")

    return {
      initial,
      fetch,
      subscription
    }
  }, [accountID, horizon])

  const page = useDataSubscription(applyAccountOffersUpdate, initial, fetch, subscription)
  return page._embedded.records
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

  const { initial, fetch, subscription } = React.useMemo(() => {
    // TODO: Cache?
    const initial = createEmptyOrderbookRecord(selling, buying)
    const fetch = fetchOrderbookRecord(horizon, selling, buying)
    const subscription = subscribeToOrderbook(horizon, selling, buying)

    return {
      initial,
      fetch,
      subscription
    }
  }, [horizon, stringifyAsset(selling), stringifyAsset(buying)])

  return useDataSubscription(applyOrderbookUpdate, initial, fetch, subscription)
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

  const { initial, fetch, subscription } = React.useMemo(() => {
    const initial = accountTransactionsCache.get(horizon, accountID) || []
    const fetch = fetchAccountTransactions(horizon, accountID, { order: "desc", limit: 15 }).then(page =>
      page._embedded.records.map(txRecord => deserializeTx(txRecord, testnet))
    )
    const subscription = subscribeToAccountTransactions(horizon, accountID, "now")

    return {
      initial,
      fetch,
      subscription
    }
  }, [accountID, horizon])

  return useDataSubscription(applyAccountTransactionsUpdate, initial, fetch, subscription)
}
