import BigNumber from "big.js"
import { useMemo } from "react"
import { FixedOrderbookOffer } from "../../lib/orderbook"

const sum = (numbers: BigNumber[]) => numbers.reduce((total, no) => total.add(no), BigNumber(0))

export function useConversionOffers(offers: FixedOrderbookOffer[], amount: number, tolerance: number) {
  // Best offers always returned first by horizon
  const bestOffers = offers
  const priceMultiplier = 1 + tolerance

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

  const estimatedReturn = sum([
    ...firstBestOffers.slice(0, -1).map(offer =>
      BigNumber(offer.amount)
        .mul(offer.price)
        .mul(priceMultiplier)
    ),
    lastBestOffer
      ? BigNumber(lastBestOffer.price)
          .mul(priceMultiplier)
          .mul(BigNumber(lastBestOffer.amount).sub(bestMatches.volume - amount))
      : BigNumber(0)
  ])

  return {
    estimatedReturn,
    worstPriceOfBestMatches
  }
}
