import { Observable, Subscription, SubscriptionObserver, unsubscribe } from "observable-fns"

type AsyncObservableInitializer<T> = (
  observer: SubscriptionObserver<T>
) => Promise<Subscription<T> | (() => void) | void>

export function observableFromAsyncFactory<T>(init: AsyncObservableInitializer<T>): Observable<T> {
  return new Observable<T>(observer => {
    let downstreamUnsubscribe: Subscription<T> | (() => void) | void
    let receivedUnsubscribe = false

    init(observer).then(
      returned => {
        downstreamUnsubscribe = returned

        if (receivedUnsubscribe) {
          unsubscribe(downstreamUnsubscribe)
        }
      },
      error => {
        observer.error(error)
      }
    )

    const upstreamUnsubscribe = () => {
      receivedUnsubscribe = true
      unsubscribe(downstreamUnsubscribe)
    }
    return upstreamUnsubscribe
  })
}
