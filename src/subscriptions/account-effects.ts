import { Server } from "stellar-sdk"
import { trackError } from "../context/notifications"
import { waitForAccountData } from "../lib/account"
import { createStreamDebouncer, trackStreamError } from "../lib/stream"
import { createSubscriptionTarget, SubscriptionTarget } from "../lib/subscription"

export function createAccountEffectsSubscription(
  horizon: Server,
  accountPubKey: string
): SubscriptionTarget<Server.EffectRecord | null> {
  const { debounceError, debounceMessage } = createStreamDebouncer<Server.EffectRecord>()
  const { propagateUpdate, subscriptionTarget } = createSubscriptionTarget<Server.EffectRecord | null>(null)

  const subscribeToEffects = (cursor: string = "now") => {
    horizon
      .effects()
      .forAccount(accountPubKey)
      .cursor(cursor)
      .stream({
        onmessage(effect: Server.EffectRecord) {
          debounceMessage(effect, () => propagateUpdate(effect))
        },
        onerror(error: Error) {
          debounceError(error, () => {
            trackStreamError(new Error("Account effects stream errored."))
          })
        }
      })
  }

  const setup = async () => {
    try {
      await horizon
        .effects()
        .forAccount(accountPubKey)
        .limit(1)
        .call()
      subscribeToEffects("now")
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
