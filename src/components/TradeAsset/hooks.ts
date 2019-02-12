import { useMemo } from "react"
import { FixedOrderbookOffer, FixedOrderbookRecord } from "../../lib/orderbook"

const sum = (numbers: number[]) => numbers.reduce((total, no) => total + no, 0)

export function useConversionOffers(orderbookRecord: FixedOrderbookRecord, amount: number, price: number) {
  // Best offers first
  const bestOffers = orderbookRecord.asks

  const bestMatches = useMemo(
    () =>
      bestOffers.reduce<{ offers: FixedOrderbookOffer[]; volume: number }>(
        (aggregate, matchingOffer) =>
          aggregate.volume >= amount
            ? aggregate
            : {
                offers: [...aggregate.offers, matchingOffer],
                volume: aggregate.volume + Number.parseFloat(matchingOffer.amount)
              },
        { offers: [], volume: 0 }
      ),
    [bestOffers, amount]
  )

  const bestPrices = bestMatches.offers.map(offer => Number.parseFloat(offer.price))
  const worstPriceOfBestMatches = bestPrices.length > 0 ? bestPrices[bestPrices.length - 1] : undefined

  const firstBestOffers = bestMatches.offers.slice(0, -1)
  const lastBestOffer = bestMatches.offers[bestMatches.offers.length - 1]

  const estimatedCost = sum([
    ...firstBestOffers.slice(0, -1).map(offer => Number.parseFloat(offer.amount) * Number.parseFloat(offer.price)),
    Number.parseFloat(lastBestOffer.price) * (Number.parseFloat(lastBestOffer.amount) - (bestMatches.volume - amount))
  ])

  return {
    estimatedCost,
    worstPriceOfBestMatches
  }
}
