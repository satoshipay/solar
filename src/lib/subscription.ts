type SubscriberFn<Thing> = (update: Thing) => void
type UnsubscribeFn = () => void

export interface SubscriptionTarget<Thing> {
  readonly id: number
  readonly closed: boolean
  close(): void
  getLatest(): Thing
  subscribe(callback: SubscriberFn<Thing>): UnsubscribeFn
}

interface SubscriptionTargetInternals<Thing> {
  closing: Promise<void>
  subscriptionTarget: SubscriptionTarget<Thing>
  propagateUpdate(update: Thing): void
}

let nextSubscriptionTargetID = 1

export function createSubscriptionTarget<Thing>(initialValue: Thing): SubscriptionTargetInternals<Thing> {
  let closed = false
  let fulfillClosingPromise: () => void = () => undefined
  let latestValue: Thing = initialValue
  let subscribers: Array<SubscriberFn<Thing>> = []

  const propagateUpdate = (updatedValue: Thing) => {
    latestValue = updatedValue
    for (const subscriber of subscribers) {
      subscriber(updatedValue)
    }
  }

  const subscriptionTarget: SubscriptionTarget<Thing> = {
    id: nextSubscriptionTargetID++,
    get closed() {
      return closed
    },
    close() {
      closed = true
      subscribers = []
      fulfillClosingPromise()
    },
    getLatest() {
      return latestValue
    },
    subscribe(callback: SubscriberFn<Thing>) {
      subscribers.push(callback)
      const unsubscribe = () => {
        subscribers = subscribers.filter(someSubscriber => someSubscriber !== callback)
      }
      return unsubscribe
    }
  }

  const closing = new Promise<void>(resolve => {
    if (closed) {
      resolve()
    }
    fulfillClosingPromise = resolve
  })

  return {
    closing,
    propagateUpdate,
    subscriptionTarget
  }
}
