import { handleConnectionState } from "./connection"

const watchdogIntervalTime = 15_000

function createReconnectDelay(options: { initialDelay: number }): () => Promise<void> {
  let delay = options.initialDelay
  let lastConnectionAttemptTime = 0

  const networkBackOnline = () => {
    if (navigator.onLine === false) {
      return new Promise(resolve => {
        self.addEventListener("online", resolve, { once: true, passive: true })
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
    const justConnectedBefore = Date.now() - lastConnectionAttemptTime < delay
    const waitUntil = Date.now() + delay

    await networkBackOnline()

    if (justConnectedBefore) {
      await timeReached(waitUntil)
      delay = Math.min(delay * 1.5, options.initialDelay * 8)
    } else {
      // Reconnect immediately (skip await) if last reconnection is long ago
      delay = options.initialDelay
    }

    lastConnectionAttemptTime = Date.now()
  }
}

interface SSEHandlers {
  onStreamError?(error: any): void
  onUnexpectedError?(error: any): void
  onMessage?(event: MessageEvent): void
}

export function createReconnectingSSE(
  createURL: () => string,
  handlers: SSEHandlers,
  queueRequest: (task: () => any) => Promise<any>
) {
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

      delayReconnect()
        .then(() => queueRequest(() => subscribe()))
        .catch(unexpectedError => {
          if (handlers.onUnexpectedError) {
            handlers.onUnexpectedError(unexpectedError)
          }
        })
    }

    currentlySubscribed = true
  }

  const setup = async () => {
    delayReconnect = createReconnectDelay({ initialDelay: 1000 })
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
