type SubscriberFn<Thing> = (update: Thing) => void
type UnsubscribeFn = () => void

export interface SubscriptionTarget<Thing> {
  readonly id: number
  getLatest(): Thing
  subscribe(callback: SubscriberFn<Thing>): UnsubscribeFn
}

interface SubscriptionTargetInternals<Thing> {
  subscriptionTarget: SubscriptionTarget<Thing>
  propagateUpdate(update: Thing): void
}

export function createDeadSubscription<Value>(initialValue: Value): SubscriptionTarget<Value> {
  const { subscriptionTarget } = createSubscriptionTarget(initialValue)
  return subscriptionTarget
}

let nextSubscriptionTargetID = 1

export function createSubscriptionTarget<Thing>(initialValue: Thing): SubscriptionTargetInternals<Thing> {
  let latestValue: Thing = initialValue
  let subscribers: Array<SubscriberFn<Thing>> = []

  const subscriptionTarget: SubscriptionTarget<Thing> = {
    id: nextSubscriptionTargetID++,
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
  const propagateUpdate = (update: Thing) => {
    latestValue = update
    for (const subscriber of subscribers) {
      subscriber(update)
    }
  }

  return {
    propagateUpdate,
    subscriptionTarget
  }
}
