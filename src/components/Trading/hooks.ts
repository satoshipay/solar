import BigNumber from "big.js"
import React from "react"
import { FixedOrderbookOffer } from "../../lib/orderbook"

const sum = (numbers: BigNumber[]) => numbers.reduce((total, no) => total.add(no), BigNumber(0))

export function useConversionOffers(
  offers: FixedOrderbookOffer[],
  amount: BigNumber,
  invertOfferAmounts: boolean = false
) {
  // Best offers always returned first by horizon
  const bestOffers = invertOfferAmounts
    ? offers.map(offer => ({
        ...offer,
        amount: BigNumber(offer.price).eq(0)
          ? BigNumber(0).toFixed(7)
          : BigNumber(offer.amount)
              .div(offer.price)
              .toFixed(7)
      }))
    : offers

  const bestMatches = React.useMemo(() => {
    const offersToCover: FixedOrderbookOffer[] = []
    let volume = BigNumber(0)

    for (const matchingOffer of bestOffers) {
      if (volume.gte(amount)) {
        break
      }
      if (!BigNumber(matchingOffer.price).eq(0)) {
        offersToCover.push(matchingOffer)
        volume = volume.add(matchingOffer.amount)
      }
    }

    return {
      offers: offersToCover,
      volume
    }
  }, [bestOffers, amount])

  const bestPrices = bestMatches.offers.map(offer => BigNumber(offer.price))
  const worstPriceOfBestMatches = bestPrices.length > 0 ? bestPrices[bestPrices.length - 1] : undefined

  const firstBestOffers = bestMatches.offers.slice(0, -1)
  const lastBestOffer = bestMatches.offers[bestMatches.offers.length - 1]

  const estimatedReturn = sum([
    ...firstBestOffers.slice(0, -1).map(offer => BigNumber(offer.amount).mul(offer.price)),
    lastBestOffer
      ? BigNumber(lastBestOffer.price).mul(BigNumber(lastBestOffer.amount).sub(bestMatches.volume.sub(amount)))
      : BigNumber(0)
  ])

  return {
    estimatedReturn,
    worstPriceOfBestMatches
  }
}
