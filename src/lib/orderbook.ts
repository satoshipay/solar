import { Asset } from "stellar-sdk"

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
