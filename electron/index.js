const { app, BrowserWindow, Menu } = require("electron")
const path = require("path")
const url = require("url")
const { createAppMenu } = require("./lib/menu")
require("electron-debug")()

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let globalWindowRef = null

app.on("ready", () => {
  Menu.setApplicationMenu(createAppMenu())
  globalWindowRef = createWindow()
})

app.on("window-all-closed", () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") {
    app.quit()
  }
})

app.on("activate", () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (globalWindowRef === null) {
    globalWindowRef = createWindow()
  }
})

function createWindow() {
  const window = new BrowserWindow({
    width: 800,
    height: 600,
    title: "SatoshiPay Wallet 🚀",
    icon: path.join(__dirname, "icon.png")
  })

  const productionURL = url.format({
    pathname: path.join(__dirname, "app/index.html"),
    protocol: "file:",
    slashes: true
  })
  const developmentURL = "http://localhost:3000/"

  window.loadURL(
    process.env.NODE_ENV === "development" ? developmentURL : productionURL
  )

  window.on("closed", () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    globalWindowRef = null
  })

  return window
}
