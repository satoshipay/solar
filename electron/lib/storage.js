const { app, ipcMain } = require("electron")
const isDev = require("electron-is-dev")
const Store = require("electron-store")

// Use different key stores for development and production
const mainStore = new Store({
  name: isDev ? "development" : "config"
})

/////////
// Keys:

ipcMain.on("storage:keys:readSync", event => {
  event.returnValue = mainStore.has("keys") ? mainStore.get("keys") : {}
})

ipcMain.on("storage:keys:storeSync", (event, arg) => {
  mainStore.set("keys", arg)
  event.returnValue = true
})

/////////////
// Settings:

ipcMain.on("storage:settings:readSync", event => {
  event.returnValue = mainStore.has("settings") ? mainStore.get("settings") : {}
})

ipcMain.on("storage:settings:storeSync", (event, newSettings) => {
  const prevSettings = mainStore.has("settings") ? mainStore.get("settings") : {}
  mainStore.set("settings", { ...prevSettings, ...newSettings })
  event.returnValue = true
})

//////////////////
// Dismissed txs:

ipcMain.on("storage:ignoredSignatureRequests:readSync", event => {
  event.returnValue = mainStore.has("ignoredSignatureRequests") ? mainStore.get("ignoredSignatureRequests") : []
})

ipcMain.on("storage:ignoredSignatureRequests:storeSync", (event, updatedIgnoredHashes) => {
  mainStore.set("ignoredSignatureRequests", updatedIgnoredHashes)
  event.returnValue = true
})
