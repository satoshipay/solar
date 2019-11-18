import { handleConnectionState } from "./connection"

const watchdogIntervalTime = 15_000

function createReconnectDelay(options: { delay: number }): () => Promise<void> {
  let lastConnectionAttemptTime = 0

  const networkBackOnline = () => {
    if (navigator.onLine === false) {
      return new Promise(resolve => {
        window.addEventListener("online", resolve, { once: true, passive: true })
      })
    } else {
      return Promise.resolve()
    }
  }

  const timeReached = (waitUntil: number) => {
    const timeToWait = waitUntil - Date.now()
    return timeToWait > 0 ? new Promise(resolve => setTimeout(resolve, timeToWait)) : Promise.resolve()
  }

  return async function delayReconnect() {
    const justConnectedBefore = Date.now() - lastConnectionAttemptTime < options.delay
    const waitUntil = Date.now() + options.delay

    await networkBackOnline()

    if (justConnectedBefore) {
      // Reconnect immediately (skip await) if last reconnection is long ago
      await timeReached(waitUntil)
    }

    lastConnectionAttemptTime = Date.now()
  }
}

interface SSEHandlers {
  onStreamError?(error: any): void
  onUnexpectedError?(error: any): void
  onMessage?(event: MessageEvent): void
}

export function createReconnectingSSE(createURL: () => string, handlers: SSEHandlers) {
  let currentlySubscribed = false
  let delayReconnect: () => Promise<void>

  let eventSource: EventSource | undefined
  let latestMessageTime = 0
  let watchdogTimeout: any

  const unsubscribeFromConnectionState = handleConnectionState({
    onOnline: () => subscribe(),
    onOffline: () => unsubscribe()
  })

  const unsubscribe = () => {
    clearTimeout(watchdogTimeout)
    currentlySubscribed = false

    if (eventSource) {
      eventSource.close()
    }
  }

  const resetWatchdog = () => {
    watchdogTimeout = setTimeout(() => {
      if (Date.now() - latestMessageTime > watchdogIntervalTime) {
        unsubscribe()
        subscribe()
      } else {
        resetWatchdog()
      }
    }, watchdogIntervalTime)
  }

  const subscribe = () => {
    if (currentlySubscribed) {
      return
    }

    eventSource = new EventSource(createURL())

    eventSource.onmessage = message => {
      if (handlers.onMessage) {
        handlers.onMessage(message)
      }
      latestMessageTime = Date.now()
    }

    eventSource.onerror = (error: any) => {
      unsubscribe()
      // tslint:disable-next-line no-console
      console.warn(`SSE stream ${createURL()} yielded an error. Will re-connect.\n  Error:`, error)

      if (handlers.onStreamError) {
        handlers.onStreamError(error)
      }

      delayReconnect().then(
        () => subscribe(),
        unexpectedError => {
          if (handlers.onUnexpectedError) {
            handlers.onUnexpectedError(unexpectedError)
          }
        }
      )
    }

    currentlySubscribed = true
  }

  const setup = async () => {
    delayReconnect = createReconnectDelay({ delay: 1000 })
    subscribe()
  }

  setup().catch(error => {
    if (handlers.onUnexpectedError) {
      handlers.onUnexpectedError(error)
    }
  })

  // Do not shorten to `return unsubscribe`, as we always want to call the current `unsubscribe`
  return () => {
    unsubscribe()
    unsubscribeFromConnectionState()
  }
}
