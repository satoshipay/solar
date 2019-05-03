import { Server } from "stellar-sdk"
import { trackError } from "../context/notifications"
import { waitForAccountData } from "../lib/account"
import { createStreamDebouncer, manageStreamConnection, trackStreamError } from "../lib/stream"
import { createSubscriptionTarget, SubscriptionTarget } from "../lib/subscription"

export function createAccountEffectsSubscription(
  horizon: Server,
  accountPubKey: string
): SubscriptionTarget<Server.EffectRecord | null> {
  const { debounceError } = createStreamDebouncer<Server.EffectRecord>()
  const { propagateUpdate, subscriptionTarget } = createSubscriptionTarget<Server.EffectRecord | null>(null)

  const subscribeToEffects = (cursor: string = "now") =>
    manageStreamConnection(() => {
      return horizon
        .effects()
        .forAccount(accountPubKey)
        .cursor(cursor)
        .stream({
          onmessage: ((effect: Server.EffectRecord) => {
            propagateUpdate(effect)
          }) as any,
          onerror(error: Error) {
            debounceError(error, () => {
              trackStreamError(new Error("Account effects stream errored."))
            })
          }
        })
    })

  const setup = async () => {
    try {
      const latestEffects = await horizon
        .effects()
        .forAccount(accountPubKey)
        .limit(1)
        .order("desc")
        .call()
      subscribeToEffects(latestEffects.records[0].paging_token)
    } catch (error) {
      if (error.response && error.response.status === 404) {
        await waitForAccountData(horizon, accountPubKey)
        subscribeToEffects("0")
      } else {
        throw error
      }
    }
  }

  setup().catch(trackError)

  return subscriptionTarget
}
