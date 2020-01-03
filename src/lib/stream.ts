type UnsubscribeFn = () => void

export function manageStreamConnection(connectStream: () => UnsubscribeFn): UnsubscribeFn {
  let unsubscribeFromCurrent: UnsubscribeFn

  const scriptContext = typeof window !== "undefined" ? window : self

  const messageHandler = (event: MessageEvent) => {
    if (event.data && event.data === "app:pause") {
      unsubscribeFromCurrent()
    } else if (event.data && event.data === "app:resume") {
      unsubscribeFromCurrent = connectStream()
    }
  }

  unsubscribeFromCurrent = connectStream()
  scriptContext.addEventListener("message", messageHandler)

  const unsubscribeCompletely = () => {
    unsubscribeFromCurrent()
    scriptContext.removeEventListener("message", messageHandler)
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

export function whenBackOnline(callback: () => void) {
  if (navigator.onLine === false) {
    ;(window || self).addEventListener("online", callback, { once: true, passive: true })
    return
  }

  // Wait a little bit, then check again (in case the offline status isn't updated in time)
  setTimeout(() => {
    if (navigator.onLine === false) {
      ;(window || self).addEventListener("online", callback, { once: true, passive: true })
      return
    } else {
      // Delay a little bit more, so we don't reconnect every few milliseconds
      setTimeout(() => callback(), 500)
    }
  }, 200)
}
