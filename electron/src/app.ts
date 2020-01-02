import { app, Menu } from "electron"
import contextMenu from "electron-context-menu"
import "./bootstrap" // should be first of all local imports
import { createAppMenu } from "./menu"
import { createMainWindow, getOpenWindows, trackWindow } from "./window"
import "./storage"
import "./updater"

// Enable opening dev tools in production using keyboard shortcut
// tslint:disable-next-line: no-var-requires
require("electron-debug")({
  isEnabled: true,
  showDevTools: false
})

// Add context menu
contextMenu()

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
