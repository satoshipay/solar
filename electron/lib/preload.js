const { ipcRenderer } = require("electron")
const electronProcess = process

let nextCommandID = 1

function sendCommand(commandType, responseType, args) {
  const messageID = nextCommandID++

  const responsePromise = new Promise(resolve => {
    const listener = (event, data) => {
      if (data.messageID === messageID) {
        data.result ? resolve(data.result) : resolve()
      }
    }

    ipcRenderer.on(responseType, listener)
  })

  ipcRenderer.send(commandType, { messageID, data: args })
  return responsePromise
}

const getKeyIDs = async () => {
  return sendCommand("keystore:getKeyIDs", "keystore:keyIDs")
}

const getPublicKeyData = async keyID => {
  const data = { keyID }
  return sendCommand("keystore:getPublicKeyData", "keystore:publicKeyData", data)
}

const getPrivateKeyData = async (keyID, password) => {
  const data = { keyID, password }
  return sendCommand("keystore:getPrivateKeyData", "keystore:privateKeyData", data)
}

const saveKey = async (keyID, password, privateData, publicData) => {
  const data = { keyID, password, privateData, publicData }
  return sendCommand("keystore:saveKey", "keystore:savedKey", data)
}

const savePublicKeyData = async (keyID, publicData) => {
  const data = { keyID, publicData }
  return sendCommand("keystore:savePublicKeyData", "keystore:savedPublicKeyData", data)
}

const signTransaction = async (transactionEnvelope, walletAccount, password) => {
  const data = { transactionEnvelope, walletAccount, password }
  return sendCommand("keystore:signTransaction", "keystore:signedTransaction", data)
}

const removeKey = async keyID => {
  const data = { keyID }
  return sendCommand("keystore:removeKey", "keystore:removedKey", data)
}

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
