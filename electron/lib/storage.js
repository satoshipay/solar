const { ipcMain } = require("electron")
const isDev = require("electron-is-dev")
const Store = require("electron-store")
const { createStore } = require("key-store")
const generateID = require("nanoid/generate")
const { Network, Keypair, Transaction } = require("stellar-sdk")
const { commands, events, expose } = require("./ipc")

// Use different key stores for development and production
const mainStore = new Store({
  name: isDev ? "development" : "config"
})

const readKeys = () => {
  return mainStore.has("keys") ? mainStore.get("keys") : {}
}

const updateKeys = arg => {
  mainStore.set("keys", arg)
  return true
}

const keystore = createStore(updateKeys, readKeys())

exports.readInstallationID = function readInstallationID() {
  if (!mainStore.has("installation-id")) {
    mainStore.set("installation-id", generateID("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789", 8))
  }
  return mainStore.get("installation-id")
}

/////////////
// Keystore:

expose(ipcMain, commands.getKeyIDsCommand, events.getKeyIDsEvent, function getKeyIDs() {
  return keystore.getKeyIDs()
})

expose(ipcMain, commands.getPublicKeyDataCommand, events.getPublicKeyDataEvent, function getPublicKeyData(keyID) {
  return keystore.getPublicKeyData(keyID)
})

expose(ipcMain, commands.getPrivateKeyDataCommand, events.getPrivateKeyDataEvent, function getPrivateKeyData(
  keyID,
  password
) {
  return keystore.getPrivateKeyData(keyID, password)
})

expose(ipcMain, commands.saveKeyCommand, events.saveKeyEvent, function saveKey(
  keyID,
  password,
  privateData,
  publicData
) {
  return keystore.saveKey(keyID, password, privateData, publicData)
})

expose(ipcMain, commands.savePublicKeyDataCommand, events.savePublicKeyDataEvent, function saveKey(keyID, publicData) {
  return keystore.savePublicKeyData(keyID, publicData)
})

expose(ipcMain, commands.removeKeyCommand, events.removeKeyEvent, function removeKey(keyID) {
  return keystore.removeKey(keyID)
})

expose(ipcMain, commands.signTransactionCommand, events.signTransactionEvent, function signTransaction(
  txEnvelopeXdr,
  keyID,
  networkPassphrase,
  password
) {
  const transaction = new Transaction(txEnvelopeXdr)
  const { privateKey } = keystore.getPrivateKeyData(keyID, password)

  Network.use(new Network(networkPassphrase))
  transaction.sign(Keypair.fromSecret(privateKey))

  return transaction.toEnvelope().toXDR("base64")
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
