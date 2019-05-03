import { Server } from "stellar-sdk"
import { trackError } from "../context/notifications"
import { waitForAccountData } from "../lib/account"
import { createSubscriptionTarget, SubscriptionTarget } from "../lib/subscription"
import { manageStreamConnection, trackStreamError } from "../lib/stream"

function getLatestOfferPagingToken(offers: Server.CollectionPage<Server.OfferRecord>) {
  if (offers.records.length > 0) {
    return offers.records[offers.records.length - 1].paging_token
  }
  return undefined
}

export interface ObservedAccountOffers {
  loading: boolean
  offers: Server.OfferRecord[]
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

  const subscribeToStream = (cursor: string) =>
    manageStreamConnection(() => {
      // horizon.offers("accounts", accountPubKey) does not seem to yield any updates, so falling back here...
      const pollingIntervalMs = 5000
      const interval = setInterval(() => {
        if (window.navigator.onLine !== false) {
          fetchAccountOffers(cursor)
            .then(accountOffers => {
              const pagingToken = getLatestOfferPagingToken(accountOffers)
              if (pagingToken) {
                cursor = pagingToken
              }
            })
            .catch(trackStreamError)
        }
      }, pollingIntervalMs)
      return () => clearInterval(interval)
    })

  const fetchAccountOffers = async (cursor: string) => {
    const accountOffers = await horizon
      .offers("accounts", accountPubKey)
      .cursor(cursor)
      .limit(maxOffers)
      .call()

    if (JSON.stringify(accountOffers.records) !== JSON.stringify(subscriptionTarget.getLatest().offers)) {
      propagateUpdate({
        ...subscriptionTarget.getLatest(),
        loading: false,
        offers: accountOffers.records
      })
    }
    return accountOffers
  }

  const setup = async () => {
    try {
      const offers = await fetchAccountOffers("0")
      subscribeToStream(getLatestOfferPagingToken(offers) || "0")
    } catch (error) {
      if (error.response && error.response.status === 404) {
        propagateUpdate({
          ...subscriptionTarget.getLatest(),
          loading: false
        })
        await waitForAccountData(horizon, accountPubKey)
        const offers = await fetchAccountOffers("0")
        subscribeToStream(getLatestOfferPagingToken(offers) || "0")
      } else {
        throw error
      }
    }
  }

  setup().catch(trackError)

  return subscriptionTarget
}
