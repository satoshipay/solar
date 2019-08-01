const { ipcRenderer } = require("electron")
const electronProcess = process

let nextCommandID = 1

function createCommand(commandType, eventType) {
  return (...args) => {
    const messageID = nextCommandID++

    const responsePromise = new Promise((resolve, reject) => {
      const listener = (event, data) => {
        if (data.messageID === messageID) {
          ipcRenderer.removeListener(eventType, listener)

          if (data.error) {
            const error = Object.assign(Error(data.error.message), {
              name: data.error.name || "Error",
              stack: data.error.stack
            })
            reject(error)
          } else if (data.result) {
            resolve(data.result)
          } else {
            resolve()
          }
        }
      }
      ipcRenderer.on(eventType, listener)
    })

    ipcRenderer.send(commandType, { messageID, args })
    return responsePromise
  }
}

const getKeyIDs = createCommand("keystore:getKeyIDs", "keystore:keyIDs")
const getPublicKeyData = createCommand("keystore:getPublicKeyData", "keystore:publicKeyData")
const getPrivateKeyData = createCommand("keystore:getPrivateKeyData", "keystore:privateKeyData")
const saveKey = createCommand("keystore:saveKey", "keystore:savedKey")
const savePublicKeyData = createCommand("keystore:savePublicKeyData", "keystore:savedPublicKeyData")
const signTransaction = createCommand("keystore:signTransaction", "keystore:signedTransaction")
const removeKey = createCommand("keystore:removeKey", "keystore:removedKey")

const readSettings = () => ipcRenderer.sendSync("storage:settings:readSync")
const updateSettings = updatedSettings => ipcRenderer.sendSync("storage:settings:storeSync", updatedSettings)

const readIgnoredSignatureRequestHashes = () => ipcRenderer.sendSync("storage:ignoredSignatureRequests:readSync")
const updateIgnoredSignatureRequestHashes = updatedSignatureRequestHashes =>
  ipcRenderer.sendSync("storage:ignoredSignatureRequests:storeSync", updatedSignatureRequestHashes)

const subscribeToIPCMain = (channel, subscribeCallback) => {
  ipcRenderer.on(channel, subscribeCallback)
  const unsubscribe = () => ipcRenderer.removeListener(channel, subscribeCallback)
  return unsubscribe
}

const electron = {
  getKeyIDs,
  getPublicKeyData,
  getPrivateKeyData,
  saveKey,
  savePublicKeyData,
  signTransaction,
  removeKey,

  readIgnoredSignatureRequestHashes,
  readSettings,
  updateIgnoredSignatureRequestHashes,
  updateSettings,
  subscribeToIPCMain
}

global.electron = window.electron = electron

process.once("loaded", () => {
  global.process = window.process = {
    env: electronProcess.env,
    pid: electronProcess.pid,
    platform: electronProcess.platform
  }
})
