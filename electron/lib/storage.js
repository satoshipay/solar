const { app, ipcMain } = require("electron")
const isDev = require("electron-is-dev")
const Store = require("electron-store")

// Use different key stores for development and production
const mainStore = new Store({
  name: isDev ? "development" : "config"
})

ipcMain.on("storage:keys:readSync", event => {
  event.returnValue = mainStore.has("keys") ? mainStore.get("keys") : {}
})

ipcMain.on("storage:keys:storeSync", (event, arg) => {
  mainStore.set("keys", arg)
  event.returnValue = true
})
