import BigNumber from "big.js"
import { Operation, ServerApi, Transaction } from "stellar-sdk"
import { OptimisticOfferUpdate } from "../../lib/optimistic-updates"

function createOffer(
  operation: Operation.ManageBuyOffer | Operation.ManageSellOffer,
  tx: Transaction
): ServerApi.OfferRecord & { _optimistic: true } {
  return {
    _optimistic: true,
    _links: {
      self: {
        href: ""
      }
    },
    id: "0",
    amount: operation.type === "manageBuyOffer" ? operation.buyAmount : operation.amount,
    buying: {
      asset_code: operation.buying.isNative() ? undefined : operation.buying.code,
      asset_issuer: operation.buying.isNative() ? undefined : operation.buying.issuer,
      asset_type: operation.buying.isNative() ? "native" : "credit_alphanum12"
    },
    last_modified_ledger: 0,
    last_modified_time: "",
    paging_token: "0",
    price: operation.price,
    price_r: {
      n: 1,
      d: 1
    },
    seller: operation.type === "manageBuyOffer" ? "" : operation.source || tx.source,
    selling: {
      asset_code: operation.selling.isNative() ? undefined : operation.selling.code,
      asset_issuer: operation.selling.isNative() ? undefined : operation.selling.issuer,
      asset_type: operation.selling.isNative() ? "native" : "credit_alphanum12"
    }
  }
}

function handleManageOffer(
  horizonURL: string,
  operation: Operation.ManageBuyOffer | Operation.ManageSellOffer,
  transaction: Transaction
): OptimisticOfferUpdate[] {
  const amount = BigNumber(operation.type === "manageBuyOffer" ? operation.buyAmount : operation.amount)
  const baseTitle =
    operation.type === "manageBuyOffer"
      ? `Buy ${operation.buying.getCode()} with ${operation.selling.getCode()}`
      : `Sell ${operation.selling.getCode()} for ${operation.buying.getCode()}`

  if (String(operation.offerId) === "0") {
    // Create offer
    const title = `Create order: ${baseTitle}`

    return [
      {
        apply(offers: ServerApi.OfferRecord[]): ServerApi.OfferRecord[] {
          return [...offers, createOffer(operation, transaction)]
        },
        effectsAccountID: operation.source || transaction.source,
        horizonURL,
        title,
        transactionHash: transaction.hash().toString("hex")
      }
    ]
  } else if (amount.eq(0)) {
    // Delete offer
    const title = `Delete order ${operation.offerId}: ${baseTitle}`

    return [
      {
        apply(offers: ServerApi.OfferRecord[]): ServerApi.OfferRecord[] {
          return offers.filter(offer => String(offer.id) !== String(operation.offerId))
        },
        effectsAccountID: operation.source || transaction.source,
        horizonURL,
        title,
        transactionHash: transaction.hash().toString("hex")
      }
    ]
  } else {
    // Edit offer
    const title = `Edit order ${operation.offerId}: ${baseTitle}`

    return [
      {
        apply(offers: ServerApi.OfferRecord[]): ServerApi.OfferRecord[] {
          return offers.map(offer => {
            return String(offer.id) === String(operation.offerId) ? createOffer(operation, transaction) : offer
          })
        },
        effectsAccountID: operation.source || transaction.source,
        horizonURL,
        title,
        transactionHash: transaction.hash().toString("hex")
      }
    ]
  }
}

export default handleManageOffer
