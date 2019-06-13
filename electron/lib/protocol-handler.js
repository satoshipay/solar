const { app } = require("electron")
const { createMainWindow, getOpenWindows, trackWindow } = require("./window")
const events = require("events")

module.exports = {
  subscribe,
  windowReady
}

app.setAsDefaultProtocolClient("solarwallet")

const urlEventEmitter = new events.EventEmitter()
const urlEventChannel = "deeplink:url"

const urlEventQueue = []
let isWindowReady = false

function subscribe(subscribeCallback) {
  urlEventEmitter.on(urlEventChannel, subscribeCallback)
  const unsubscribe = () => urlEventEmitter.removeListener(urlEventChannel, subscribeCallback)
  return unsubscribe
}

// called when the application is ready to process the deeplink urls
function windowReady() {
  isWindowReady = true
  // emit items that were produced before app was ready
  urlEventQueue.forEach(item => urlEventEmitter.emit(urlEventChannel, item))
}

function emitURL(url) {
  if (isWindowReady) {
    urlEventEmitter.emit(urlEventChannel, url)
  } else {
    urlEventQueue.push(url)
  }
}

app.on("ready", () => {
  if (process.platform === "win32" || process.platform === "linux") {
    if (process.argv) {
      const deeplinkURL = process.argv.slice(1)[0]
      if (deeplinkURL !== null && deeplinkURL !== "") {
        emitURL(deeplinkURL)
      }
    }
  }
})

app.on("will-finish-launching", () => {
  // only called on macOS
  app.on("open-url", function(event, url) {
    event.preventDefault()
    emitURL(url)
  })
})

const gotSingleInstanceLock = app.requestSingleInstanceLock()

if (!gotSingleInstanceLock) {
  app.quit()
} else {
  // will not be called on macOS except when application launched from CLI
  app.on("second-instance", (event, commandLine, workingDirectory) => {
    // Focus window
    if (getOpenWindows().length === 0) {
      appReady.then(() => {
        trackWindow(createMainWindow())
      })
    }

    if (process.platform === "win32" || process.platform === "linux") {
      deeplinkURL = commandLine.slice(1)[0]
      if (deeplinkURL !== null && deeplinkURL !== "") {
        emitURL(deeplinkURL)
      }
    }
  })
}
