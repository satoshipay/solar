import { Asset, Server, ServerApi } from "stellar-sdk"
import { trackConnectionError } from "../context/notifications"
import { createMessageDeduplicator, manageStreamConnection, whenBackOnline, ServiceType } from "../lib/stream"
import { createSubscriptionTarget, SubscriptionTarget } from "../lib/subscription"
import { FixedOrderbookRecord } from "../lib/orderbook"

export interface ObservedTradingPair extends FixedOrderbookRecord {
  loading: boolean
}

const createEmptyTradingPair = (selling: Asset, buying: Asset): ObservedTradingPair => ({
  asks: [],
  base: selling,
  bids: [],
  counter: buying,
  loading: true
})

export function createOrderbookSubscription(
  horizon: Server,
  selling: Asset,
  buying: Asset
): SubscriptionTarget<ObservedTradingPair> {
  const maxOrderCount = 30
  const dedupeMessage = createMessageDeduplicator<FixedOrderbookRecord>()
  const { closing, propagateUpdate, subscriptionTarget } = createSubscriptionTarget(
    createEmptyTradingPair(selling, buying)
  )

  const streamOrderUpdates = (cursor: string = "now") =>
    manageStreamConnection(ServiceType.Horizon, trackStreamError => {
      let unsubscribe = horizon
        .orderbook(selling, buying)
        .cursor(cursor)
        .stream({
          onmessage: (((record: FixedOrderbookRecord) => {
            dedupeMessage(record, () => {
              const previous = subscriptionTarget.getLatest()
              propagateUpdate({
                ...previous,
                ...record,
                asks: [...previous.asks, ...record.asks],
                bids: [...previous.bids, ...record.bids]
              })
            })
          }) as unknown) as (record: ServerApi.OrderbookRecord) => () => void,
          onerror() {
            trackStreamError(Error("Orderbook update stream errored."))
            unsubscribe()
            whenBackOnline(() => {
              unsubscribe = streamOrderUpdates(cursor)
            })
          }
        })
      // Don't simplify to `return unsubscribe`, since we need to call the current unsubscribe
      return () => unsubscribe()
    })

  const setup = async () => {
    const fetched = await horizon
      .orderbook(selling, buying)
      .limit(maxOrderCount)
      .call()

    if (subscriptionTarget.closed) {
      return
    }

    // @types/stellar-sdk types seem wrong
    const orderbookRecord = (fetched as any) as FixedOrderbookRecord

    propagateUpdate({
      ...subscriptionTarget.getLatest(),
      ...orderbookRecord,
      loading: false
    })
    const unsubscribeCompletely = streamOrderUpdates()
    closing.then(unsubscribeCompletely)
  }

  setup().catch(trackConnectionError)

  return subscriptionTarget
}
