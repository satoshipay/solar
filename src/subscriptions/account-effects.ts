import { Server, ServerApi } from "stellar-sdk"
import { trackConnectionError } from "../context/notifications"
import { waitForAccountData } from "../lib/account"
import { isNotFoundError } from "../lib/stellar"
import { manageStreamConnection, whenBackOnline, ServiceType } from "../lib/stream"
import { createSubscriptionTarget, SubscriptionTarget } from "../lib/subscription"

export function createAccountEffectsSubscription(
  horizon: Server,
  accountPubKey: string
): SubscriptionTarget<ServerApi.EffectRecord | null> {
  const { closing, propagateUpdate, subscriptionTarget } = createSubscriptionTarget<ServerApi.EffectRecord | null>(null)

  const subscribeToEffects = (cursor: string = "now") => {
    let unsubscribe = manageStreamConnection(ServiceType.Horizon, trackStreamError => {
      return horizon
        .effects()
        .forAccount(accountPubKey)
        .cursor(cursor)
        .stream({
          onmessage: ((effect: ServerApi.EffectRecord) => {
            if (effect.paging_token) {
              cursor = effect.paging_token
            }
            propagateUpdate(effect)
          }) as any,
          onerror() {
            trackStreamError(Error("Account effects stream errored."))
            unsubscribe()
            whenBackOnline(() => {
              unsubscribe = subscribeToEffects(cursor)
            })
          }
        })
    })
    // Don't simplify to `return unsubscribe`, since we need to call the current unsubscribe
    return () => unsubscribe()
  }

  const setup = async () => {
    try {
      const latestEffects = await horizon
        .effects()
        .forAccount(accountPubKey)
        .limit(1)
        .order("desc")
        .call()

      if (subscriptionTarget.closed) {
        return
      }

      // Horizon used to return an empty effects array instead of 404 if the account doesn't exist
      const cursor = latestEffects.records[0] ? latestEffects.records[0].paging_token : "0"
      const unsubscribeCompletely = subscribeToEffects(cursor)
      closing.then(unsubscribeCompletely)
    } catch (error) {
      const shouldCancel = () => subscriptionTarget.closed

      if (isNotFoundError(error)) {
        await waitForAccountData(horizon, accountPubKey, shouldCancel)
        const unsubscribeCompletely = subscribeToEffects("0")
        closing.then(unsubscribeCompletely)
      } else {
        throw error
      }
    }
  }

  setup().catch(trackConnectionError)

  return subscriptionTarget
}
