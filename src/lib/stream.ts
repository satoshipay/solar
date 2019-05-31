import { trackError } from "../context/notifications"

type UnsubscribeFn = () => void

export function manageStreamConnection(connectStream: () => UnsubscribeFn): UnsubscribeFn {
  let unsubscribeFromCurrent = connectStream()

  const messageHandler = (event: MessageEvent) => {
    if (event.data && event.data === "app:pause") {
      unsubscribeFromCurrent()
    } else if (event.data && event.data === "app:resume") {
      unsubscribeFromCurrent = connectStream()
    }
  }

  window.addEventListener("message", messageHandler)

  const unsubscribeCompletely = () => {
    unsubscribeFromCurrent()
    window.removeEventListener("message", messageHandler)
  }
  return unsubscribeCompletely
}

export function createStreamDebouncer<MessageType>() {
  let lastMessageJson = ""
  let lastMessageTime = 0

  const debounceError = (error: Error, handler: (error: Error) => void) => {
    setTimeout(() => {
      if (Date.now() - lastMessageTime > 3000) {
        // Every few seconds there is a new useless error with the same data as the previous.
        // So don't show them if there is a successful message afterwards (stream still seems to work)
        handler(error)
      } else {
        // tslint:disable-next-line:no-console
        console.debug("Account data update stream had an error, but still seems to work fine:", error)
      }
    }, 2500)
  }

  const debounceMessage = (message: MessageType, handler: (message: MessageType) => void) => {
    const serialized = JSON.stringify(message)
    lastMessageTime = Date.now()

    if (serialized !== lastMessageJson) {
      // Deduplicate messages. Every few seconds horizon streams yield a new message with an unchanged value.
      lastMessageJson = serialized
      handler(message)
    }
  }

  return {
    debounceError,
    debounceMessage
  }
}

export function trackStreamError(error: Error) {
  if (window.navigator.onLine === false) {
    // ignore the error if we are offline; the online/offline status is handled separately
    return
  }

  // Wait a little bit, then check again (in case the offline status isn't updated in time)
  setTimeout(() => {
    if (window.navigator.onLine !== false) {
      trackError(error)
    }
  }, 200)
}
