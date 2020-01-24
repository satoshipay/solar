import { multicast, Observable, Subject, Subscription } from "observable-fns"
import { whenBackOnline } from "../../lib/stream"
import { raiseConnectionError, ServiceID } from "../net-worker/errors"
import { createIntervalRunner } from "./connection"

const subscriptionReset = new Subject<void>()

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function resetSubscriptions() {
  // tslint:disable-next-line no-console
  console.debug("Resetting net-worker subscriptions…")
  subscriptionReset.next()
}

export interface SubscriberImplementation<ValueT, UpdateT = ValueT> {
  applyUpdate(update: UpdateT): Promise<ValueT>
  fetchUpdate(streamedUpdate?: UpdateT): Promise<UpdateT | undefined>
  handleError?(error: Error): void
  init(): Promise<ValueT | undefined>
  shouldApplyUpdate(update: UpdateT): boolean
  subscribeToUpdates(): Observable<UpdateT>
}

export function subscribeToUpdatesAndPoll<ValueT, UpdateT = ValueT>(
  implementation: SubscriberImplementation<ValueT, UpdateT>,
  serviceID: ServiceID,
  options?: { retryFetchOnNoUpdate: boolean }
): Observable<ValueT> {
  const { retryFetchOnNoUpdate = true } = options || {}
  let lastConnectionErrorTime = 0

  return multicast(
    new Observable<ValueT>(observer => {
      let cancelled = false
      let resetSubscription: Subscription<void> = { unsubscribe: () => undefined } as any

      let unsubscribe = () => {
        cancelled = true
        resetSubscription.unsubscribe()
      }

      const handleConnectionError = (error: Error) => {
        if (cancelled) {
          return
        }

        if (navigator.onLine !== false && Date.now() - lastConnectionErrorTime < 3000) {
          // double trouble
          raiseConnectionError(error, serviceID)
        }
        lastConnectionErrorTime = Date.now()
      }

      const handleUnexpectedError = (error: Error) => {
        try {
          if (implementation.handleError) {
            implementation.handleError(error)
          } else {
            throw error
          }
        } catch (error) {
          observer.error(error)
        }
      }

      const handleSetupError = (error: Error) => {
        if (cancelled) {
          return
        }

        handleConnectionError(error)

        if (navigator.onLine === false) {
          whenBackOnline(() => setup().catch(handleSetupError))
        } else {
          setTimeout(() => setup().catch(handleSetupError), Date.now() - lastConnectionErrorTime < 3000 ? 2000 : 500)
        }
      }

      const fetchAndApplyUpdate = async (streamedUpdate?: UpdateT, retry: number = 0): Promise<void> => {
        try {
          let update: UpdateT | undefined

          try {
            update = await implementation.fetchUpdate(streamedUpdate)
          } catch (error) {
            return handleConnectionError(error)
          }

          if (update && implementation.shouldApplyUpdate(update)) {
            const applied = await implementation.applyUpdate(update)
            observer.next(applied)
          } else if (retryFetchOnNoUpdate && retry < 5) {
            // tslint:disable-next-line no-bitwise
            await delay(500 * (1 << retry))
            return fetchAndApplyUpdate(streamedUpdate, retry + 1)
          }
        } catch (error) {
          handleUnexpectedError(error)
        }
      }

      const interval = createIntervalRunner(() => {
        if (navigator.onLine !== false) {
          fetchAndApplyUpdate()
        }
      }, 60_000)

      const setup = async () => {
        const setupValue = await implementation.init()

        if (setupValue) {
          observer.next(setupValue)
        }

        if (cancelled) {
          return
        }

        const subscription = implementation.subscribeToUpdates().subscribe(
          update => {
            fetchAndApplyUpdate(update).catch(handleUnexpectedError)
            interval.reset()
          },
          error => {
            handleConnectionError(error)
            unsubscribe()

            // Re-initialize stream
            setup().catch(handleSetupError)
          },
          () => {
            observer.complete()
            unsubscribe()

            // We assume the source entity we subscribed to does not exist anymore
          }
        )

        unsubscribe = () => {
          cancelled = true
          interval.stop()
          resetSubscription.unsubscribe()
          subscription.unsubscribe()
        }
      }

      setup().catch(handleSetupError)

      // Do not shorten to `return unsubscribe`, as we always want to call the current `unsubscribe`
      resetSubscription = subscriptionReset.subscribe(() => unsubscribe())

      // Do not shorten to `return unsubscribe`, as we always want to call the current `unsubscribe`
      return () => unsubscribe()
    })
  )
}
