const { BrowserWindow } = require("electron")
const open = require("opn")
const path = require("path")
const url = require("url")

let openWindows = []

module.exports = {
  createMainWindow,
  getOpenWindows,
  trackWindow
}

// start protocol handler
const protocolHandler = require("./protocol-handler")

function createMainWindow() {
  const window = new BrowserWindow({
    width: 800,
    height: 600,
    minWidth: 400,
    minHeight: 300,
    title: "Solar Wallet",
    icon: path.join(__dirname, "../build/icon.png"),
    backgroundColor: "#0196E8",
    titleBarStyle: process.platform === "darwin" ? "hidden" : "default",
    webPreferences: {
      nodeIntegration: false,
      nodeIntegrationInWorker: false,
      preload: path.join(__dirname, "preload.js"),
      sandbox: true,
      webviewTag: false
    }
  })

  const pathname =
    process.env.NODE_ENV === "development"
      ? path.join(__dirname, "../../dist/index.dev.html")
      : path.join(__dirname, "../../dist/index.prod.html")

  const webappURL = url.format({
    pathname,
    protocol: "file:",
    slashes: true
  })

  window.loadURL(webappURL)

  window.webContents.on("new-window", (event, url) => {
    event.preventDefault()
    open(url)
  })

  // subscribe this window to deeplink urls
  const unsubscribe = protocolHandler.subscribe(url => {
    window.webContents.send("deeplink:url", url)
    if (process.platform === "linux") {
      // needed for minimized windows to come to the foreground
      window.minimize()
      window.restore()
      window.focus()
    }
    window.show()
  })

  // unsubscribe on window close
  window.on("closed", () => {
    protocolHandler.windowDestroyed()
    unsubscribe()
  })

  window.webContents.on("did-finish-load", () => {
    protocolHandler.windowReady()
  })

  return window
}

function getOpenWindows() {
  return openWindows
}

// Keep a global reference of the window object. If you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
function trackWindow(window) {
  openWindows.push(window)

  window.on("closed", () => {
    openWindows = openWindows.filter(someWindow => someWindow !== window)
  })

  return window
}
