import { events } from "../../cordova/ipc"

export function subscribeToDeepLinkURLs(callback: (url: string) => void) {
  const eventListener = (event: Event) => {
    if (event instanceof MessageEvent && event.source === window.parent) {
      if (event.data.eventType === events.deeplinkURLEvent) {
        callback(event.data.url)
      }
    }
  }

  window.addEventListener("message", eventListener)

  return () => window.removeEventListener("message", eventListener)
}
