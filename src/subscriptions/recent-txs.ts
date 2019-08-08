import { NotFoundError, Server, ServerApi, Transaction } from "stellar-sdk"
import { trackConnectionError } from "../context/notifications"
import { waitForAccountData } from "../lib/account"
import { manageStreamConnection, whenBackOnline, ServiceType } from "../lib/stream"
import { createSubscriptionTarget, SubscriptionTarget } from "../lib/subscription"
import { createCheapTxID } from "../lib/transaction"

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

function deserializeTx(txResponse: ServerApi.TransactionRecord) {
  return Object.assign(new Transaction(txResponse.envelope_xdr), {
    created_at: txResponse.created_at
  })
}

export function createRecentTxsSubscription(
  horizon: Server,
  accountPubKey: string
): SubscriptionTarget<ObservedRecentTxs> {
  const maxTxsToLoadCount = 15
  const { closing, propagateUpdate, subscriptionTarget } = createSubscriptionTarget(createEmptyTransactionSet())

  const fetchRecentTxs = async (limit: number) => {
    const { records } = await horizon
      .transactions()
      .forAccount(accountPubKey)
      .limit(limit)
      .order("desc")
      .call()
    return records
  }
  const subscribeToTxs = (cursor: string) =>
    manageStreamConnection(ServiceType.Horizon, trackStreamError => {
      let unsubscribe = horizon
        .transactions()
        .forAccount(accountPubKey)
        .cursor(cursor)
        .stream({
          onmessage: ((transaction: ServerApi.TransactionRecord) => {
            if (
              subscriptionTarget
                .getLatest()
                .transactions.map(tx => createCheapTxID(tx))
                .indexOf(createCheapTxID(transaction)) === -1
            ) {
              if (transaction.paging_token) {
                cursor = transaction.paging_token
              }
              propagateUpdate({
                ...subscriptionTarget.getLatest(),
                transactions: [deserializeTx(transaction), ...subscriptionTarget.getLatest().transactions]
              })
            }
          }) as any,
          onerror() {
            trackStreamError(Error("Recent transactions update stream errored."))
            unsubscribe()
            whenBackOnline(() => {
              unsubscribe = subscribeToTxs(cursor)
            })
          }
        })
      // Don't simplify to `return unsubscribe`, since we need to call the current unsubscribe
      return () => unsubscribe()
    })

  const shouldCancel = () => subscriptionTarget.closed

  const setup = async () => {
    try {
      const recentTxs = await fetchRecentTxs(maxTxsToLoadCount)

      if (subscriptionTarget.closed) {
        return
      }
      propagateUpdate({
        ...subscriptionTarget.getLatest(),
        transactions: [...subscriptionTarget.getLatest().transactions, ...recentTxs.map(deserializeTx)],
        activated: true,
        loading: false
      })

      const unsubscribeCompletely = subscribeToTxs(recentTxs[0].paging_token)
      closing.then(unsubscribeCompletely)
    } catch (error) {
      if (error instanceof NotFoundError) {
        propagateUpdate({
          ...subscriptionTarget.getLatest(),
          activated: false,
          loading: false
        })
        await waitForAccountData(horizon, accountPubKey, shouldCancel)
        propagateUpdate({
          ...subscriptionTarget.getLatest(),
          activated: true,
          loading: false
        })
        const unsubscribeCompletely = subscribeToTxs("0")
        closing.then(unsubscribeCompletely)
      } else {
        throw error
      }
    }
  }

  setup().catch(trackConnectionError)

  return subscriptionTarget
}
