const { app, Menu } = require("electron")
const { createAppMenu } = require("./menu")
const { createMainWindow, trackWindow } = require("./window")
require("./storage")

// Enable opening dev tools in production using keyboard shortcut
require("electron-debug")({
  enabled: true,
  showDevTools: process.env.NODE_ENV === "development"
})

const appReady = new Promise(resolve => app.on("ready", resolve))

app.on("ready", () => {
  Menu.setApplicationMenu(createAppMenu())
  trackWindow(createMainWindow())
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
  appReady.then(() => {
    trackWindow(createMainWindow())
  })
})
