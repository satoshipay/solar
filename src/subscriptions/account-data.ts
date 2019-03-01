import { Horizon, Server } from "stellar-sdk"
import { trackError } from "../context/notifications"
import { loadAccount, waitForAccountData } from "../lib/account"
import { createStreamDebouncer, trackStreamError } from "../lib/stream"
import { createSubscriptionTarget, SubscriptionTarget } from "../lib/subscription"

export interface ObservedAccountData {
  activated: boolean
  balances: Horizon.BalanceLine[]
  data: Horizon.AccountResponse["data"]
  id: string
  loading: boolean
  signers: Horizon.AccountSigner[]
  thresholds: Horizon.AccountThresholds
}

const createEmptyAccountData = (accountID: string): ObservedAccountData => ({
  activated: false,
  balances: [],
  data: {},
  id: accountID,
  loading: true,
  signers: [],
  thresholds: {
    low_threshold: 0,
    med_threshold: 0,
    high_threshold: 0
  }
})

export function createAccountDataSubscription(
  horizon: Server,
  accountPubKey: string
): SubscriptionTarget<ObservedAccountData> {
  const { debounceError, debounceMessage } = createStreamDebouncer<Server.AccountRecord>()
  const { propagateUpdate, subscriptionTarget } = createSubscriptionTarget(createEmptyAccountData(accountPubKey))

  const subscribeToStream = (cursor: string = "now") => {
    horizon
      .accounts()
      .accountId(accountPubKey)
      .cursor(cursor)
      .stream({
        onmessage(accountData: Server.AccountRecord) {
          debounceMessage(accountData, () => {
            propagateUpdate({
              ...subscriptionTarget.getLatest(),
              ...(accountData as any)
            })
          })
        },
        onerror(error: any) {
          debounceError(error, () => {
            trackStreamError(new Error("Account data update stream errored."))
          })
        }
      } as any)
  }

  const setup = async () => {
    const initialAccountData = await loadAccount(horizon, accountPubKey)
    propagateUpdate({
      ...subscriptionTarget.getLatest(),
      loading: false
    })

    const accountData = initialAccountData || (await waitForAccountData(horizon, accountPubKey))
    const accountWasJustCreated = !initialAccountData

    propagateUpdate({
      ...subscriptionTarget.getLatest(),
      ...(accountData as any),
      activated: true
    })
    subscribeToStream(accountWasJustCreated ? "0" : "now")
  }

  setup().catch(trackError)

  return subscriptionTarget
}
