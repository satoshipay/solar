import { AccountResponse, Server, ServerApi } from "stellar-sdk"
import { trackConnectionError } from "../context/notifications"
import { createEmptyAccountData, loadAccount, waitForAccountData, AccountData } from "../lib/account"
import { createMessageDeduplicator, manageStreamConnection, whenBackOnline, ServiceType } from "../lib/stream"
import { createSubscriptionTarget, SubscriptionTarget } from "../lib/subscription"

export interface ObservedAccountData extends AccountData {
  activated: boolean
  loading: boolean
}

const doNothing = () => undefined

export function createAccountDataSubscription(
  horizon: Server,
  accountPubKey: string
): SubscriptionTarget<ObservedAccountData> {
  let latestPagingToken: string = "now"
  let pollingInterval: any = 0

  const dedupeMessage = createMessageDeduplicator<ServerApi.AccountRecord | AccountResponse>()

  const { closing, propagateUpdate, subscriptionTarget } = createSubscriptionTarget<ObservedAccountData>({
    ...createEmptyAccountData(accountPubKey),
    activated: false,
    loading: true
  })

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

        latestPagingToken = accountData.paging_token
        const updatedAccountData = {
          ...subscriptionTarget.getLatest(),
          ...(accountData as any)
        }

        dedupeMessage(updatedAccountData, () => {
          propagateUpdate(updatedAccountData)
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
            latestPagingToken = accountData.paging_token
            const updatedAccountData = {
              ...subscriptionTarget.getLatest(),
              ...(accountData as any)
            }

            dedupeMessage(updatedAccountData, () => {
              propagateUpdate(updatedAccountData)
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
