export function createIntervalRunner(action: () => void, intervalTime: number) {
  let interval: any

  const reset = () => {
    clearInterval(interval)
    interval = setInterval(action, intervalTime)
  }
  const stop = () => {
    clearInterval(interval)
  }

  reset()

  return {
    reset,
    stop
  }
}

interface ConnectionStateHandlers {
  onOffline?(): void
  onOnline?(): void
}

export function handleConnectionState(handlers: ConnectionStateHandlers) {
  const { onOffline = () => undefined, onOnline = () => undefined } = handlers

  const handleMessage = (event: MessageEvent) => {
    if (event.data && event.data === "app:pause") {
      onOffline()
    } else if (event.data && event.data === "app:pause") {
      onOnline()
    }
  }

  self.addEventListener("message", handleMessage)
  self.addEventListener("offline", onOffline)
  self.addEventListener("online", onOnline)

  const unsubscribe = () => {
    self.removeEventListener("message", handleMessage)
    self.removeEventListener("offline", onOffline)
    self.removeEventListener("online", onOnline)
  }
  return unsubscribe
}
