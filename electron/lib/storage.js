const { app, ipcMain } = require("electron")
const Store = require("electron-store")

const mainStore = new Store()

ipcMain.on("storage:keys:readSync", event => {
  event.returnValue = mainStore.has("keys") ? mainStore.get("keys") : {}
})

ipcMain.on("storage:keys:storeSync", (event, arg) => {
  mainStore.set("keys", arg)
  event.returnValue = true
})
