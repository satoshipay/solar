import { Server, ServerApi, Transaction } from "stellar-sdk"
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

function descByDate(a: Transaction, b: Transaction) {
  return a.sequence > b.sequence ? 1 : -1
}

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
          onmessage(transactions: ServerApi.CollectionPage<ServerApi.TransactionRecord>) {
            const knownTransactions = subscriptionTarget.getLatest().transactions
            const knownTransactionCheapIDs = knownTransactions.map(tx => createCheapTxID(tx))

            const trulyNewTransactions = transactions.records.filter(
              transaction => knownTransactionCheapIDs.indexOf(createCheapTxID(transaction)) === -1
            )
            const orderedNewTransactions = trulyNewTransactions.map(deserializeTx).sort(descByDate)

            cursor = trulyNewTransactions[trulyNewTransactions.length - 1].paging_token

            propagateUpdate({
              ...subscriptionTarget.getLatest(),
              transactions: [...orderedNewTransactions, ...subscriptionTarget.getLatest().transactions]
            })
          },
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
      if (error.response && error.response.status === 404) {
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
