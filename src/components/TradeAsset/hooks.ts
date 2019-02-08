import { useMemo } from "react"
import { FixedOrderbookOffer } from "../../lib/orderbook"
import { ObservedTradingPair } from "../../lib/subscriptions"

const sum = (numbers: number[]) => numbers.reduce((total, no) => total + no, 0)

export function useTradingPair(tradePair: ObservedTradingPair, action: "buy" | "sell", price: number, amount: number) {
  // Best offers first
  const bestOffers = useMemo(
    () =>
      action === "buy"
        ? [...tradePair.asks].sort((a, b) => Number.parseFloat(a.price) - Number.parseFloat(b.price))
        : [...tradePair.bids].sort((a, b) => Number.parseFloat(b.price) - Number.parseFloat(a.price)),
    [action, action === "buy" ? tradePair.asks : tradePair.bids]
  )

  const bestMatches = useMemo(
    () =>
      bestOffers
        .filter(
          offer =>
            Number.isNaN(price) ||
            (action === "buy" ? parseFloat(offer.price) < price : parseFloat(offer.price) > price)
        )
        .reduce<{ offers: FixedOrderbookOffer[]; volume: number }>(
          (aggregate, matchingOffer) =>
            aggregate.volume >= amount
              ? aggregate
              : {
                  offers: [...aggregate.offers, matchingOffer],
                  volume: aggregate.volume + Number.parseFloat(matchingOffer.amount)
                },
          { offers: [], volume: 0 }
        ),
    [action, bestOffers, price, amount]
  )

  const bestPrices = bestMatches.offers.map(offer => Number.parseFloat(offer.price))
  const worstPriceOfBestMatches =
    bestPrices.length > 0 ? (action === "buy" ? Math.max(...bestPrices) : Math.min(...bestPrices)) : undefined

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
