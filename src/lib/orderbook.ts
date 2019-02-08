import BigNumber from "big.js"
import { Asset } from "stellar-sdk"

/*
 * Quick orderbook cheat sheet:
 *
 * Consider a trading pair T (buy=asset_x, sell=asset_y).
 * The inverse would be T'(buy=asset_y, sell=asset_x).
 *
 * asks(T) === bids(T').map(offer => ({ ...offer, price = 1 / offer.price }))
 * asks(T') === bids(T).map(offer => ({ ...offer, price = 1 / offer.price }))
 *
 * Since the asks & bids are ordered from closest to last trade price to furthest when
 * returned by horizon server, the order of asks(T) & bids(T') is the same as well.
 */

// @types/stellar-sdk types seem wrong
export interface FixedOrderbookOffer {
  price_r: {
    n: number
    d: number
  }
  price: string
  amount: string
}

// @types/stellar-sdk types seem wrong
export interface FixedOrderbookRecord {
  asks: FixedOrderbookOffer[]
  bids: FixedOrderbookOffer[]
  base: Asset
  counter: Asset
}

function invertOffer(offer: FixedOrderbookOffer): FixedOrderbookOffer {
  return {
    amount: offer.amount,
    price_r: {
      d: offer.price_r.n,
      n: offer.price_r.d
    },
    price: BigNumber(1)
      .div(BigNumber(offer.price))
      .toString()
  }
}

export function invertOrderbookRecord(record: FixedOrderbookRecord): FixedOrderbookRecord {
  return {
    asks: record.bids.map(invertOffer),
    bids: record.asks.map(invertOffer),
    base: record.counter,
    counter: record.base
  }
}
