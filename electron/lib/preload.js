const { ipcRenderer } = require("electron")

const electronProcess = process

const readKeys = () => ipcRenderer.sendSync("storage:keys:readSync")
const updateKeys = data => ipcRenderer.sendSync("storage:keys:storeSync", data)

const readSettings = () => ipcRenderer.sendSync("storage:settings:readSync")
const updateSettings = updatedSettings => ipcRenderer.sendSync("storage:settings:storeSync", updatedSettings)

const readIgnoredSignatureRequestHashes = () => ipcRenderer.sendSync("storage:ignoredSignatureRequests:readSync")
const updateIgnoredSignatureRequestHashes = updatedSignatureRequestHashes =>
  ipcRenderer.sendSync("storage:ignoredSignatureRequests:storeSync", updatedSignatureRequestHashes)

const electron = {
  readIgnoredSignatureRequestHashes,
  readKeys,
  readSettings,
  updateIgnoredSignatureRequestHashes,
  updateKeys,
  updateSettings
}

global.electron = window.electron = electron

process.once("loaded", () => {
  global.process = window.process = {
    env: electronProcess.env,
    pid: electronProcess.pid,
    platform: electronProcess.platform
  }
})
