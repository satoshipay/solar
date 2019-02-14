import { AccountRecord, Server } from "stellar-sdk"
import { loadAccount, waitForAccountData } from "../lib/account"
import { createStreamDebouncer } from "../lib/stream"
import { createSubscriptionTarget, SubscriptionTarget } from "../lib/subscription"
import { trackError } from "../context/notifications"

export interface ObservedAccountData {
  activated: boolean
  balances: AccountRecord["balances"]
  id: string
  loading: boolean
  signers: AccountRecord["signers"]
  thresholds: AccountRecord["thresholds"]
}

const createEmptyAccountData = (accountID: string): ObservedAccountData => ({
  activated: false,
  balances: [],
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
  const { debounceError, debounceMessage } = createStreamDebouncer<AccountRecord>()
  const { propagateUpdate, subscriptionTarget } = createSubscriptionTarget(createEmptyAccountData(accountPubKey))

  const subscribeToStream = (cursor: string = "now") => {
    horizon
      .accounts()
      .accountId(accountPubKey)
      .cursor(cursor)
      .stream({
        onmessage(accountData: AccountRecord) {
          debounceMessage(accountData, () => {
            propagateUpdate({
              ...subscriptionTarget.getLatest(),
              ...(accountData as any)
            })
          })
        },
        onerror(error: any) {
          debounceError(error, () => {
            trackError(new Error("Account data update stream errored."))
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
