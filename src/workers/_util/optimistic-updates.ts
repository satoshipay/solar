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
export type OptimisticOfferUpdate = OptimisticUpdate<Horizon.ManageOfferOperationResponse>

const createAccountCacheKeyByFilter = (horizonURL: string, accountID: string) => `${horizonURL}/accounts/${accountID}`
const createAccountCacheKey = (update: OptimisticAccountUpdate) =>
  createAccountCacheKeyByFilter(update.horizonURL, update.effectsAccountID)

function OptimisticUpdateCache<Update extends OptimisticUpdate<any>, FilterArgs extends any[]>(
  createCacheKey: (update: Update) => string,
  createCacheKeyByFilter: (...filterArgs: FilterArgs) => string
) {
  const subject = new Subject<Update>()
  const updates = new Map<string, Update[]>()

  return {
    addUpdates(optimisticUpdates: Update[]) {
      for (const optimisticUpdate of optimisticUpdates) {
        const selector = createCacheKey(optimisticUpdate)
        const prevUpdates = updates.get(selector) || []

        updates.set(selector, [...prevUpdates, optimisticUpdate])
        subject.next(optimisticUpdate)
      }
    },
    getUpdates(...args: FilterArgs) {
      const selector = createCacheKeyByFilter(...args)
      return updates.get(selector) || []
    },
    observe() {
      return Observable.from(subject)
    },
    removeStaleUpdates(horizonURL: string, latestTransactionHashs: string[]) {
      for (const selector of updates.keys()) {
        const prevOptimisticUpdates = updates.get(selector)!
        const nextOptimisticUpdates = prevOptimisticUpdates.filter(
          optUpdate =>
            !(optUpdate.horizonURL === horizonURL && latestTransactionHashs.indexOf(optUpdate.transactionHash) > -1)
        )

        if (nextOptimisticUpdates.length !== prevOptimisticUpdates.length) {
          updates.set(selector, nextOptimisticUpdates)
        }
      }
    },
    updates
  }
}

export const accountDataUpdates = OptimisticUpdateCache(createAccountCacheKey, createAccountCacheKeyByFilter)
