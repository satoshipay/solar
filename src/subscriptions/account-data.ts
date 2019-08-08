import { AccountResponse, Horizon, Server, ServerApi } from "stellar-sdk"
import { trackConnectionError } from "../context/notifications"
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

const doNothing = () => undefined

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
  let pollingInterval: any = 0

  const dedupeMessage = createMessageDeduplicator<ServerApi.AccountRecord | AccountResponse>()

  const { closing, propagateUpdate, subscriptionTarget } = createSubscriptionTarget(
    createEmptyAccountData(accountPubKey)
  )
  const setPollingInterval = () => {
    // Bullet-proofing the important account data updates
    return setInterval(async () => {
      if (subscriptionTarget.closed) {
        clearInterval(pollingInterval)
        return
      }
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
    if (subscriptionTarget.closed) {
      return doNothing
    }

    let unsubscribeFromEventSource = manageStreamConnection(ServiceType.Horizon, trackStreamError => {
      return horizon
        .accounts()
        .accountId(accountPubKey)
        .cursor(cursor)
        .stream({
          reconnectTimeout: 8000,
          onmessage(accountData: ServerApi.AccountRecord) {
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
            unsubscribeFromEventSource()
            whenBackOnline(() => {
              unsubscribeFromEventSource = subscribeToStream(latestPagingToken)
            })
          }
        })
    })
    // Don't simplify to `return unsubscribeFromEventSource`, since the function will change over time
    return () => {
      unsubscribeFromEventSource()
      clearInterval(pollingInterval)
    }
  }

  const setup = async () => {
    const initialAccountData = await loadAccount(horizon, accountPubKey)
    propagateUpdate({
      ...subscriptionTarget.getLatest(),
      loading: false
    })

    const shouldCancel = () => subscriptionTarget.closed
    const accountData =
      initialAccountData || (await waitForAccountData(horizon, accountPubKey, shouldCancel)).accountData
    pollingInterval = setPollingInterval()

    propagateUpdate({
      ...subscriptionTarget.getLatest(),
      ...(accountData as any),
      activated: true
    })

    latestPagingToken = accountData.paging_token

    const unsubscribeCompletely = subscribeToStream(accountData.paging_token)
    closing.then(unsubscribeCompletely)
  }

  setup().catch(trackConnectionError)

  return subscriptionTarget
}
