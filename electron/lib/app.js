const { app, Menu } = require("electron")
const { createAppMenu } = require("./menu")
const { createMainWindow, getOpenWindows, trackWindow } = require("./window")

// Needs to match the value in electron-build.yml
app.setAppUserModelId("io.solarwallet.app")

require("./storage")
require("./updater")

// Enable opening dev tools in production using keyboard shortcut
require("electron-debug")({
  enabled: true,
  showDevTools: process.env.NODE_ENV === "development"
})

// Add context menu
require("electron-context-menu")()

const appReady = new Promise(resolve => app.on("ready", resolve))

app.on("ready", () => {
  const menu = createAppMenu()

  if (menu) {
    Menu.setApplicationMenu(menu)
  }

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
  if (getOpenWindows().length === 0) {
    appReady.then(() => {
      trackWindow(createMainWindow())
    })
  }
})
