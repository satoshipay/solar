import { Asset, Server } from "stellar-sdk"
import { createStreamDebouncer } from "../lib/stream"
import { createSubscriptionTarget, SubscriptionTarget } from "../lib/subscription"
import { FixedOrderbookRecord } from "../lib/orderbook"
import { trackError } from "../context/notifications"

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
  const { debounceError, debounceMessage } = createStreamDebouncer<FixedOrderbookRecord>()
  const { propagateUpdate, subscriptionTarget } = createSubscriptionTarget(createEmptyTradingPair(selling, buying))

  const streamOrderUpdates = (cursor: string = "now") => {
    horizon
      .orderbook(selling, buying)
      .cursor(cursor)
      .stream({
        onmessage(record: FixedOrderbookRecord) {
          debounceMessage(record, () => {
            const previous = subscriptionTarget.getLatest()
            propagateUpdate({
              ...previous,
              ...record,
              asks: [...previous.asks, ...record.asks],
              bids: [...previous.bids, ...record.bids]
            })
          })
        },
        onerror(error: any) {
          // FIXME: We don't want to see errors for every single stream,
          // unless it's really a stream-instance-specific error
          debounceError(error, () => {
            trackError(new Error("Orderbook update stream errored."))
          })
        }
      } as any)
  }
  const setup = async () => {
    const fetchResult = await horizon
      .orderbook(selling, buying)
      .limit(maxOrderCount)
      .call()

    // @types/stellar-sdk types seem wrong
    const orderbookRecord = (fetchResult as any) as FixedOrderbookRecord

    propagateUpdate({
      ...subscriptionTarget.getLatest(),
      ...orderbookRecord,
      loading: false
    })
    streamOrderUpdates()
  }

  setup().catch(trackError)

  return subscriptionTarget
}
