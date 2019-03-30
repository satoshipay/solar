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
  const pollIntervalMs = 10000

  const { debounceError, debounceMessage } = createStreamDebouncer<Server.TransactionRecord>()
  const { propagateUpdate, subscriptionTarget } = createSubscriptionTarget(createEmptyTransactionSet())

  const getUnknownTransactions = (fetchedTxs: Server.TransactionRecord[]) => {
    const knownTxHashes = subscriptionTarget.getLatest().transactions.map(tx => tx.hash().toString("hex"))
    return fetchedTxs.filter(loadedTx => knownTxHashes.indexOf(loadedTx.hash) === -1)
  }

  const handleNewTxs = (newTxs: Server.TransactionRecord[]) => {
    const trulyNewTxs = getUnknownTransactions(newTxs)
    // Important: Insert new transactions in the front, since order is descending
    propagateUpdate({
      ...subscriptionTarget.getLatest(),
      transactions: [...trulyNewTxs.map(deserializeTx), ...subscriptionTarget.getLatest().transactions]
    })
  }

  const syncRecentTxs = async (limit: number) => {
    try {
      const loadedTxs = await fetchRecentTxs(limit)
      handleNewTxs(getUnknownTransactions(loadedTxs))
    } catch (error) {
      trackError(error)
    }
  }

  // We also poll every few seconds, as a fallback, since the horizon's SSE stream seems unreliable (#437)
  const schedulePolling = (intervalMs: number) => setInterval(() => syncRecentTxs(3), intervalMs)

  const fetchRecentTxs = async (limit: number) => {
    const { records } = await horizon
      .transactions()
      .forAccount(accountPubKey)
      .limit(limit)
      .order("desc")
      .call()
    return records
  }
  const subscribeToTxs = (cursor: string = "now") => {
    schedulePolling(pollIntervalMs)
    horizon
      .transactions()
      .forAccount(accountPubKey)
      .cursor(cursor)
      .stream({
        onmessage(txResponse: Server.TransactionRecord) {
          debounceMessage(txResponse, () => {
            handleNewTxs(getUnknownTransactions([txResponse]))
          })
        },
        onerror(error: Error) {
          debounceError(error, () => {
            trackStreamError(new Error("Recent transactions update stream errored."))
          })
        }
      })
  }

  const setup = async () => {
    try {
      const loadedTxs = await fetchRecentTxs(maxTxsToLoadCount)
      propagateUpdate({
        ...subscriptionTarget.getLatest(),
        transactions: [...subscriptionTarget.getLatest().transactions, ...loadedTxs.map(deserializeTx)],
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
