import throttle from "lodash.throttle"
import { multicast, Observable } from "@andywer/observable-fns"
import { createIntervalRunner } from "./connection"

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
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
  options?: { retryFetchOnNoUpdate: boolean }
): Observable<ValueT> {
  const { retryFetchOnNoUpdate = true } = options || {}

  return multicast(
    new Observable<ValueT>(observer => {
      let cancelled = false

      let unsubscribe = () => {
        cancelled = true
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

      const fetchAndApplyUpdate = throttle(
        async (streamedUpdate?: UpdateT, retry: number = 0): Promise<void> => {
          try {
            const update = await implementation.fetchUpdate(streamedUpdate)

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
        },
        250,
        { leading: true, trailing: true }
      )

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
            // tslint:disable-next-line no-console
            fetchAndApplyUpdate(update).catch(handleUnexpectedError)
            interval.reset()
          },
          error => observer.error(error),
          () => observer.complete()
        )

        unsubscribe = () => {
          interval.stop()
          subscription.unsubscribe()
        }
      }

      setup().catch(error => observer.error(error))

      // Do not shorten to `return unsubscribe`, as we always want to call the current `unsubscribe`
      return () => unsubscribe()
    })
  )
}
