import { Asset, Server } from "stellar-sdk"
import { trackError } from "../context/notifications"
import { waitForAccountData } from "../lib/account"
import { createSubscriptionTarget, SubscriptionTarget } from "../lib/subscription"
import { trackStreamError } from "../lib/stream"

export interface ObservedAccountOffers {
  loading: boolean
  offers: Server.OfferRecord[]
}

type SerializedAsset =
  | {
      balance: string
      asset_type: "native"
    }
  | {
      balance: string
      limit: string
      asset_type: "credit_alphanum4" | "credit_alphanum12"
      asset_code: string
      asset_issuer: string
    }

function instantiateOffer(offer: Server.OfferRecord) {
  // Fix offer to match the TypeScript types by instantiating the assets
  const buying: SerializedAsset = offer.buying as any
  const selling: SerializedAsset = offer.selling as any
  return {
    ...offer,
    buying: buying.asset_type === "native" ? Asset.native() : new Asset(buying.asset_code, buying.asset_issuer),
    selling: selling.asset_type === "native" ? Asset.native() : new Asset(selling.asset_code, selling.asset_issuer)
  }
}

export function createAccountOffersSubscription(
  horizon: Server,
  accountPubKey: string
): SubscriptionTarget<ObservedAccountOffers> {
  const maxOffers = 100
  const { propagateUpdate, subscriptionTarget } = createSubscriptionTarget<ObservedAccountOffers>({
    loading: true,
    offers: []
  })

  const subscribeToStream = () => {
    // horizon.offers("accounts", accountPubKey) does not seem to yield any updates, so falling back here...
    const pollingIntervalMs = 5000
    setInterval(() => {
      if (window.navigator.onLine !== false) {
        fetchAccountOffers().catch(trackStreamError)
      }
    }, pollingIntervalMs)
  }

  const fetchAccountOffers = async () => {
    const accountOffers = await horizon
      .offers("accounts", accountPubKey)
      .limit(maxOffers)
      .call()

    const offers = accountOffers.records.map(instantiateOffer)

    if (JSON.stringify(offers) !== JSON.stringify(subscriptionTarget.getLatest().offers)) {
      propagateUpdate({
        ...subscriptionTarget.getLatest(),
        loading: false,
        offers
      })
    }
  }

  const setup = async () => {
    try {
      await fetchAccountOffers()
      subscribeToStream()
    } catch (error) {
      if (error.response && error.response.status === 404) {
        propagateUpdate({
          ...subscriptionTarget.getLatest(),
          loading: false
        })
        await waitForAccountData(horizon, accountPubKey)
        await fetchAccountOffers()
        subscribeToStream()
      } else {
        throw error
      }
    }
  }

  setup().catch(trackError)

  return subscriptionTarget
}
