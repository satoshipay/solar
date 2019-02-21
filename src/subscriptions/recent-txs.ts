import { Server, Transaction } from "stellar-sdk"
import { waitForAccountData } from "../lib/account"
import { createStreamDebouncer } from "../lib/stream"
import { createSubscriptionTarget, SubscriptionTarget } from "../lib/subscription"
import { trackError } from "../context/notifications"

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
  const { debounceError, debounceMessage } = createStreamDebouncer<Server.TransactionRecord>()
  const { propagateUpdate, subscriptionTarget } = createSubscriptionTarget(createEmptyTransactionSet())

  const loadRecentTxs = async () => {
    const { records } = await horizon
      .transactions()
      .forAccount(accountPubKey)
      .limit(maxTxsToLoadCount)
      .order("desc")
      .call()

    propagateUpdate({
      ...subscriptionTarget.getLatest(),
      transactions: [...subscriptionTarget.getLatest().transactions, ...records.map(deserializeTx)]
    })
  }
  const subscribeToTxs = (cursor: string = "now") => {
    horizon
      .transactions()
      .forAccount(accountPubKey)
      .cursor(cursor)
      .stream({
        onmessage(txResponse: Server.TransactionRecord) {
          debounceMessage(txResponse, () => {
            // Important: Insert new transactions in the front, since order is descending
            propagateUpdate({
              ...subscriptionTarget.getLatest(),
              transactions: [deserializeTx(txResponse), ...subscriptionTarget.getLatest().transactions]
            })
          })
        },
        onerror(error: Error) {
          debounceError(error, () => {
            trackError(new Error("Recent transactions update stream errored."))
          })
        }
      })
  }

  const setup = async () => {
    try {
      await loadRecentTxs()
      propagateUpdate({
        ...subscriptionTarget.getLatest(),
        activated: true,
        loading: false
      })
      subscribeToTxs("now")
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
