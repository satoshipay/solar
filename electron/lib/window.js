const { BrowserWindow } = require("electron")
const path = require("path")
const url = require("url")

let openWindows = []

module.exports = {
  createMainWindow,
  getOpenWindows,
  trackWindow
}

function createMainWindow() {
  const window = new BrowserWindow({
    width: 800,
    height: 600,
    title: "SatoshiPay Wallet",
    icon: path.join(__dirname, "../build/icon.png"),
    backgroundColor: "white",
    nodeIntegration: false,
    titleBarStyle: process.platform === "darwin" ? "hidden" : "default"
  })

  const webappURL = url.format({
    pathname: path.join(__dirname, "../../dist/index.html"),
    protocol: "file:",
    slashes: true
  })

  window.loadURL(webappURL)

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
