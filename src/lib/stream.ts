import { trackError } from "../context/notifications"

type ErrorHandler = (error: Error) => void
type UnsubscribeFn = () => void

let lastAppPauseTime = 0
let lastAppResumeTime = 0

const lastErrorTimeByService: { [service in ServiceType]?: number } = {}

export const enum ServiceType {
  Horizon = "Horizon",
  MultiSigCoordinator = "MultiSigCoordinator"
}

const ServiceMessages: { [service in ServiceType]: string } = {
  [ServiceType.Horizon]: "Horizon connection error",
  [ServiceType.MultiSigCoordinator]: "Multi-signature service connection error"
}

export function manageStreamConnection(
  service: ServiceType,
  connectStream: (onError: ErrorHandler) => UnsubscribeFn
): UnsubscribeFn {
  let unsubscribeFromCurrent: UnsubscribeFn

  const errorHandler = (error: Error) => trackStreamError(service, error)

  const messageHandler = (event: MessageEvent) => {
    if (event.data && event.data === "app:pause") {
      lastAppPauseTime = Date.now()
      unsubscribeFromCurrent()
    } else if (event.data && event.data === "app:resume") {
      lastAppResumeTime = Date.now()
      unsubscribeFromCurrent = connectStream(errorHandler)
    }
  }

  unsubscribeFromCurrent = connectStream(errorHandler)
  window.addEventListener("message", messageHandler)

  const unsubscribeCompletely = () => {
    unsubscribeFromCurrent()
    window.removeEventListener("message", messageHandler)
  }
  return unsubscribeCompletely
}

export function createMessageDeduplicator<MessageType>() {
  let lastMessageJson = ""

  const deduplicateMessage = (message: MessageType, handler: (message: MessageType) => void) => {
    const serialized = JSON.stringify(message)

    if (serialized !== lastMessageJson) {
      // Deduplicate messages. Every few seconds horizon streams yield a new message with an unchanged value.
      lastMessageJson = serialized
      handler(message)
    }
  }

  return deduplicateMessage
}

export function trackStreamError(service: ServiceType, error: Error) {
  const trackingTime = Date.now()

  if (window.navigator.onLine === false || lastAppPauseTime > lastAppResumeTime) {
    // ignore the error if we are offline; the online/offline status is handled separately
    // tslint:disable-next-line no-console
    console.debug("Not showing streaming error, since we just went offline:", error)
    return
  }

  // Wait a little bit, then check again (in case the offline status isn't updated in time)
  setTimeout(() => {
    if (trackingTime >= lastAppPauseTime && trackingTime < lastAppResumeTime) {
      // tslint:disable-next-line no-console
      console.debug("Not showing streaming error, since it happened when app was in background:", error)
      return
    }

    const serviceLastErrorTime = lastErrorTimeByService[service]
    lastErrorTimeByService[service] = trackingTime

    if (serviceLastErrorTime && Math.abs(serviceLastErrorTime - trackingTime) < 200) {
      // tslint:disable-next-line no-console
      console.debug(`Not showing streaming error, since we just started showing an error for ${service}:`, error)
      return
    }

    if (window.navigator.onLine !== false) {
      trackError(ServiceMessages[service] || error.message)
      // tslint:disable-next-line no-console
      console.error("  Detailed error:", error)
    }
  }, 200)
}

export function whenBackOnline(callback: () => void) {
  if (window.navigator.onLine === false) {
    window.addEventListener("online", callback, { once: true, passive: true })
    return
  }

  // Wait a little bit, then check again (in case the offline status isn't updated in time)
  setTimeout(() => {
    if (window.navigator.onLine === false) {
      window.addEventListener("online", callback, { once: true, passive: true })
      return
    } else {
      // Delay a little bit more, so we don't reconnect every few milliseconds
      setTimeout(() => callback(), 500)
    }
  }, 200)
}
