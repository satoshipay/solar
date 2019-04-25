import { Server, Transaction } from "stellar-sdk"
import { trackError } from "../context/notifications"
import { waitForAccountData } from "../lib/account"
import { createStreamDebouncer, trackStreamError } from "../lib/stream"
import { createSubscriptionTarget, SubscriptionTarget } from "../lib/subscription"

export interface ObservedRecentTxs {
  activated: boolean
  loading: boolean
  transactions: Transaction[]
}

const createEmptyTransactionSet = (): ObservedRecentTxs => ({
  activated: false,
  loading: true,
  transactions: []
})

function deserializeTx(txResponse: Server.TransactionRecord) {
  return Object.assign(new Transaction(txResponse.envelope_xdr), {
    created_at: txResponse.created_at
  })
}

export function createRecentTxsSubscription(
  horizon: Server,
  accountPubKey: string
): SubscriptionTarget<ObservedRecentTxs> {
  const maxTxsToLoadCount = 15

  const { debounceError } = createStreamDebouncer<Server.TransactionRecord>()
  const { propagateUpdate, subscriptionTarget } = createSubscriptionTarget(createEmptyTransactionSet())

  const fetchRecentTxs = async (limit: number) => {
    const { records } = await horizon
      .transactions()
      .forAccount(accountPubKey)
      .limit(limit)
      .order("desc")
      .call()
    return records
  }
  const subscribeToTxs = (cursor: string) => {
    horizon
      .transactions()
      .forAccount(accountPubKey)
      .cursor(cursor)
      .stream({
        onmessage: ((transaction: Server.TransactionRecord) => {
          propagateUpdate({
            ...subscriptionTarget.getLatest(),
            transactions: [deserializeTx(transaction), ...subscriptionTarget.getLatest().transactions]
          })
        }) as any,
        onerror(error: Error) {
          debounceError(error, () => {
            trackStreamError(new Error("Recent transactions update stream errored."))
          })
        }
      })
  }

  const setup = async () => {
    try {
      const recentTxs = await fetchRecentTxs(maxTxsToLoadCount)
      propagateUpdate({
        ...subscriptionTarget.getLatest(),
        transactions: [...subscriptionTarget.getLatest().transactions, ...recentTxs.map(deserializeTx)],
        activated: true,
        loading: false
      })
      subscribeToTxs(recentTxs[0].paging_token)
    } catch (error) {
      if (error.response && error.response.status === 404) {
        propagateUpdate({
          ...subscriptionTarget.getLatest(),
          activated: false,
          loading: false
        })
        await waitForAccountData(horizon, accountPubKey)
        propagateUpdate({
          ...subscriptionTarget.getLatest(),
          activated: true,
          loading: false
        })
        subscribeToTxs("0")
      } else {
        throw error
      }
    }
  }

  setup().catch(trackError)

  return subscriptionTarget
}
