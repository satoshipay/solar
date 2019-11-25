import { Asset, Horizon, Networks, Server, Transaction, ServerApi } from "stellar-sdk"
import { Observable, ObservableLike } from "@andywer/observable-fns"
import { stringifyAsset } from "../lib/stellar"
import { workers } from "../worker-controller"

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

export type OrdersPage = Pick<CollectionPage<ServerApi.OfferRecord>, "_embedded">

export interface PaginationOptions {
  cursor?: string
  limit?: number
  order?: "asc" | "desc"
}

function proxyAsyncObservable<T>(promise: Promise<ObservableLike<T>>): Observable<T> {
  return new Observable<T>(observer => {
    let cancelled = false
    let subscription: any

    promise
      .then(observable => {
        if (!cancelled) {
          subscription = observable.subscribe(observer)
        }
      })
      .catch(error => observer.error(error))

    return () => {
      cancelled = true
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  })
}

function toPlainObservable<T>(observablePromise: ObservableLike<T>): ObservableLike<T> {
  ;(observablePromise as any).then = undefined
  return observablePromise
}

export function deserializeTx(txResponse: Horizon.TransactionResponse, testnet: boolean) {
  const networkPassphrase = testnet ? Networks.TESTNET : Networks.PUBLIC
  return Object.assign(new Transaction(txResponse.envelope_xdr, networkPassphrase), {
    created_at: txResponse.created_at
  })
}

export async function fetchAccountData(horizon: Server, accountID: string) {
  const { netWorker } = await workers
  return netWorker.fetchAccountData(String(horizon.serverURL), accountID)
}

export async function fetchAccountOpenOrders(horizon: Server, accountID: string, options?: PaginationOptions) {
  const { netWorker } = await workers
  return netWorker.fetchAccountOpenOrders(String(horizon.serverURL), accountID, options) as Promise<OrdersPage>
}

export async function fetchAccountTransactions(horizon: Server, accountID: string, options: PaginationOptions) {
  const { netWorker } = await workers
  return netWorker.fetchAccountTransactions(String(horizon.serverURL), accountID, options)
}

export async function fetchOrderbookRecord(horizon: Server, selling: Asset, buying: Asset) {
  const { netWorker } = await workers
  return netWorker.fetchOrderbookRecord(String(horizon.serverURL), stringifyAsset(selling), stringifyAsset(buying))
}

export function subscribeToAccount(horizon: Server, accountID: string) {
  return proxyAsyncObservable(
    (async () => {
      const { netWorker } = await workers
      return (toPlainObservable(
        netWorker.subscribeToAccount(String(horizon.serverURL), accountID)
      ) as any) as ObservableLike<Horizon.AccountResponse | null>
    })()
  )
}

export function subscribeToAccountEffects(horizon: Server, accountID: string) {
  return proxyAsyncObservable(
    (async () => {
      const { netWorker } = await workers
      return (toPlainObservable(
        netWorker.subscribeToAccountEffects(String(horizon.serverURL), accountID)
      ) as any) as ObservableLike<ServerApi.EffectRecord>
    })()
  )
}

export function subscribeToOpenOrders(horizon: Server, accountID: string) {
  return proxyAsyncObservable(
    (async () => {
      const { netWorker } = await workers
      return (toPlainObservable(
        netWorker.subscribeToOpenOrders(String(horizon.serverURL), accountID)
      ) as any) as ObservableLike<ServerApi.OfferRecord[]>
    })()
  )
}

export function subscribeToAccountTransactions(horizon: Server, accountID: string) {
  return proxyAsyncObservable(
    (async () => {
      const { netWorker } = await workers
      return (toPlainObservable(
        netWorker.subscribeToAccountTransactions(String(horizon.serverURL), accountID)
      ) as any) as ObservableLike<Horizon.TransactionResponse>
    })()
  )
}

export function subscribeToOrderbook(horizon: Server, selling: Asset, buying: Asset) {
  return proxyAsyncObservable(
    (async () => {
      const { netWorker } = await workers
      return (toPlainObservable(
        netWorker.subscribeToOrderbook(String(horizon.serverURL), stringifyAsset(selling), stringifyAsset(buying))
      ) as any) as ObservableLike<ServerApi.OrderbookRecord>
    })()
  )
}
