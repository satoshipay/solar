// tslint:disable member-ordering
import { Observable, Subject } from "observable-fns"
import { Horizon } from "stellar-sdk"

export interface OptimisticUpdate<BaseDataT> {
  apply<T extends BaseDataT>(base: T): T
  effectsAccountID: string
  horizonURL: string
  title: string
  transactionHash: string
}

export type OptimisticAccountUpdate = OptimisticUpdate<Horizon.AccountResponse>

const createAccountCacheKey = (horizonURL: string, accountID: string) => `${horizonURL}/accounts/${accountID}`

const optimisticAccountDataUpdates = new Map<string, OptimisticAccountUpdate[]>()
const optimisticAccountDataSubject = new Subject<OptimisticUpdate<Horizon.AccountResponse>>()

export function addAccountUpdates(optimisticUpdates: OptimisticAccountUpdate[]) {
  for (const optimisticUpdate of optimisticUpdates) {
    const selector = createAccountCacheKey(optimisticUpdate.horizonURL, optimisticUpdate.effectsAccountID)
    const prevUpdates = optimisticAccountDataUpdates.get(selector) || []

    optimisticAccountDataUpdates.set(selector, [...prevUpdates, optimisticUpdate])
    optimisticAccountDataSubject.next(optimisticUpdate)
  }
}

export function getAccountUpdates(horizonURL: string, accountID: string): OptimisticAccountUpdate[] {
  const selector = createAccountCacheKey(horizonURL, accountID)
  return optimisticAccountDataUpdates.get(selector) || []
}

export function newOptimisticAccountUpdates(): Observable<OptimisticAccountUpdate> {
  return Observable.from(optimisticAccountDataSubject)
}

export function removeStaleAccountUpdates(horizonURL: string, latestTransactionHashs: string[]) {
  for (const selector of optimisticAccountDataUpdates.keys()) {
    const prevOptimisticUpdates = optimisticAccountDataUpdates.get(selector)!
    const nextOptimisticUpdates = prevOptimisticUpdates.filter(
      optUpdate =>
        !(optUpdate.horizonURL === horizonURL && latestTransactionHashs.indexOf(optUpdate.transactionHash) > -1)
    )

    if (nextOptimisticUpdates.length !== prevOptimisticUpdates.length) {
      optimisticAccountDataUpdates.set(selector, nextOptimisticUpdates)
    }
  }
}
