import { app } from "electron"
import events from "events"
import { createMainWindow, getOpenWindows, trackWindow } from "./window"
import { expose } from "./ipc/_ipc"
import { Messages } from "./shared/ipc"

const urlEventEmitter = new events.EventEmitter()
const urlEventChannel = "deeplink:url"

let urlEventQueue: string[] = []
let isWindowReady = false

expose(Messages.IsDefaultProtocolClient, () => {
  return app.isDefaultProtocolClient("web+stellar")
})

expose(Messages.IsDifferentHandlerInstalled, () => {
  const name = app.getApplicationNameForProtocol("web+stellar://") // '://' is needed here
  return Boolean(name)
})

expose(Messages.SetAsDefaultProtocolClient, () => {
  // Disabled until we actually ship SEP-7 support
  // return app.setAsDefaultProtocolClient("web+stellar")
  return false
})

export function subscribe(subscribeCallback: (...args: any[]) => void) {
  urlEventEmitter.on(urlEventChannel, subscribeCallback)
  const unsubscribe = () => urlEventEmitter.removeListener(urlEventChannel, subscribeCallback)
  return unsubscribe
}

// called when the application is ready to process the deeplink urls
export function windowReady() {
  isWindowReady = true
  // emit items that were produced before app was ready
  urlEventQueue.forEach(item => urlEventEmitter.emit(urlEventChannel, item))
  urlEventQueue = []
}

// called to make emitURL queue url events
export function windowDestroyed() {
  isWindowReady = false
}

function emitURL(url: string) {
  if (isWindowReady) {
    urlEventEmitter.emit(urlEventChannel, url)
  } else {
    urlEventQueue.push(url)
  }
}

const appReady = new Promise(resolve =>
  app.on("ready", () => {
    if (process.platform === "win32" || process.platform === "linux") {
      if (process.argv) {
        const deeplinkURL = process.argv.slice(1)[0]
        if (deeplinkURL != null && deeplinkURL !== "") {
          emitURL(deeplinkURL)
        }
      }
    }
    resolve()
  })
)

app.on("will-finish-launching", () => {
  // only called on macOS
  app.on("open-url", (event, url) => {
    event.preventDefault()
    emitURL(url)

    // create new window if necessary
    appReady.then(() => {
      if (getOpenWindows().length === 0) {
        trackWindow(createMainWindow())
      }
    })
  })
})

const gotSingleInstanceLock = app.requestSingleInstanceLock()

if (!gotSingleInstanceLock) {
  app.quit()
} else {
  // will not be called on macOS except when application launched from CLI
  app.on("second-instance", (event, commandLine, workingDirectory) => {
    if (getOpenWindows().length === 0) {
      appReady.then(() => {
        trackWindow(createMainWindow())
      })
    }

    if (process.platform === "win32" || process.platform === "linux") {
      const deeplinkURL = commandLine.slice(1)[0]
      if (deeplinkURL != null && deeplinkURL !== "") {
        emitURL(deeplinkURL)
      }
    }
  })
}
