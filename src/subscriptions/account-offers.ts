import { Server, ServerApi } from "stellar-sdk"
import { trackConnectionError } from "../context/notifications"
import { waitForAccountData } from "../lib/account"
import { createSubscriptionTarget, SubscriptionTarget } from "../lib/subscription"
import { manageStreamConnection, ServiceType } from "../lib/stream"

export interface ObservedAccountOffers {
  loading: boolean
  offers: ServerApi.OfferRecord[]
}

export function createAccountOffersSubscription(
  horizon: Server,
  accountPubKey: string
): SubscriptionTarget<ObservedAccountOffers> {
  const maxOffers = 100
  const { closing, propagateUpdate, subscriptionTarget } = createSubscriptionTarget<ObservedAccountOffers>({
    loading: true,
    offers: []
  })

  const subscribeToStream = () =>
    manageStreamConnection(ServiceType.Horizon, trackStreamError => {
      // horizon.offers("accounts", accountPubKey) does not seem to yield any updates, so falling back here...
      const pollingIntervalMs = 5000
      const update = () => {
        if (window.navigator.onLine !== false) {
          // Always set cursor to zero, since we want all the open offers, not just recent ones
          fetchAccountOffers("0").catch(error => trackStreamError(error))
        }
      }
      update()
      const interval = setInterval(() => update(), pollingIntervalMs)
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

  const shouldCancel = () => subscriptionTarget.closed

  const setup = async () => {
    try {
      const unsubscribeCompletely = subscribeToStream()
      closing.then(unsubscribeCompletely)
    } catch (error) {
      if (error.response && error.response.status === 404) {
        propagateUpdate({
          ...subscriptionTarget.getLatest(),
          loading: false
        })
        await waitForAccountData(horizon, accountPubKey, shouldCancel)
        const unsubscribeCompletely = subscribeToStream()
        closing.then(unsubscribeCompletely)
      } else {
        throw error
      }
    }
  }

  setup().catch(trackConnectionError)

  return subscriptionTarget
}
