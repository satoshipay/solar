import { Horizon, Server } from "stellar-sdk"
import { trackError } from "../context/notifications"
import { loadAccount, waitForAccountData } from "../lib/account"
import { createMessageDeduplicator, manageStreamConnection, whenBackOnline, ServiceType } from "../lib/stream"
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
  let latestPagingToken: string = "now"
  const dedupeMessage = createMessageDeduplicator<Server.AccountRecord>()
  const { propagateUpdate, subscriptionTarget } = createSubscriptionTarget(createEmptyAccountData(accountPubKey))

  let pollingInterval: any = 0

  const setPollingInterval = () => {
    // Bullet-proofing the important account data updates
    return setInterval(async () => {
      if (window.navigator.onLine === false) {
        return
      }

      try {
        const accountData = await horizon.loadAccount(accountPubKey)

        if (accountData.paging_token < latestPagingToken) {
          return
        }

        dedupeMessage(accountData, () => {
          latestPagingToken = accountData.paging_token
          propagateUpdate({
            ...subscriptionTarget.getLatest(),
            ...(accountData as any)
          })
        })
      } catch (error) {
        // tslint:disable-next-line no-console
        console.error("Account data polling failed:", error)
      }
    }, 10000)
  }

  const subscribeToStream = (cursor: string = "now") => {
    let unsubscribe = manageStreamConnection(ServiceType.Horizon, trackStreamError => {
      return horizon
        .accounts()
        .accountId(accountPubKey)
        .cursor(cursor)
        .stream({
          reconnectTimeout: 8000,
          onmessage(accountData: Server.AccountRecord) {
            dedupeMessage(accountData, () => {
              latestPagingToken = accountData.paging_token
              propagateUpdate({
                ...subscriptionTarget.getLatest(),
                ...(accountData as any)
              })
            })
          },
          onerror() {
            trackStreamError(Error("Account data update stream errored."))
            unsubscribe()
            whenBackOnline(() => {
              unsubscribe = subscribeToStream(latestPagingToken)
            })
          }
        } as any)
    })
    // Don't simplify to `return unsubscribe`, since we need to call the current unsubscribe
    return () => {
      unsubscribe()
      clearInterval(pollingInterval)
    }
  }

  const setup = async () => {
    const initialAccountData = await loadAccount(horizon, accountPubKey)
    propagateUpdate({
      ...subscriptionTarget.getLatest(),
      loading: false
    })

    const accountData = initialAccountData || (await waitForAccountData(horizon, accountPubKey)).accountData
    pollingInterval = setPollingInterval()

    propagateUpdate({
      ...subscriptionTarget.getLatest(),
      ...(accountData as any),
      activated: true
    })

    latestPagingToken = accountData.paging_token
    subscribeToStream(accountData.paging_token)
  }

  setup().catch(trackError)

  return subscriptionTarget
}
