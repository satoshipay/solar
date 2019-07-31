const { app, ipcMain } = require("electron")
const isDev = require("electron-is-dev")
const Store = require("electron-store")
const { createStore } = require("key-store")
const { Network, Keypair, Transaction } = require("stellar-sdk")
const { commands, events } = require("./key-store-ipc")

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

function signTransaction(transaction, account, password) {
  if (account.requiresPassword && !password) {
    throw Error(`Account is password-protected, but no password has been provided.`)
  }

  const privateKeyData = keystore.getPrivateKeyData(account.id, password)
  const privateKey = privateKeyData.privateKey

  if (account.testnet) {
    Network.useTestNetwork()
  } else {
    Network.usePublicNetwork()
  }

  transaction.sign(Keypair.fromSecret(privateKey))
  return transaction
}

/////////
// Keystore:

ipcMain.on(commands.getKeyIDsCommand, (event, args) => {
  const { messageID } = args
  event.sender.send(events.getKeyIDsEvent, { messageID, result: keystore.getKeyIDs() })
})

ipcMain.on(commands.getPublicKeyDataCommand, (event, args) => {
  const { messageID, data } = args
  const { keyID } = data

  event.sender.send(events.getPublicKeyDataEvent, { messageID, result: keystore.getPublicKeyData(keyID) })
})

ipcMain.on(commands.getPrivateKeyDataCommand, (event, args) => {
  const { messageID, data } = args
  const { keyID, password } = data

  event.sender.send(events.getPrivateKeyDataEvent, { messageID, result: keystore.getPrivateKeyData(keyID, password) })
})

ipcMain.on(commands.saveKeyCommand, (event, args) => {
  const { messageID, data } = args
  const { keyID, password, privateData, publicData } = data

  keystore.saveKey(keyID, password, privateData, publicData)

  event.sender.send(events.saveKeyEvent, { messageID })
})

ipcMain.on(commands.savePublicKeyDataCommand, (event, args) => {
  const { messageID, data } = args
  const { keyID, publicData } = data

  keystore.savePublicKeyData(keyID, publicData)

  event.sender.send(events.savePublicKeyDataEvent, { messageID })
})

ipcMain.on(commands.removeKeyCommand, (event, args) => {
  const { messageID, data } = args
  const { keyID } = data

  keystore.removeKey(keyID)

  event.sender.send(events.removeKeyEvent, { messageID })
})

ipcMain.on(commands.signTransactionCommand, async (event, args) => {
  const { messageID, data } = args
  const { transactionEnvelope, walletAccount, password } = data

  const transaction = new Transaction(transactionEnvelope)
  const signedTransaction = signTransaction(transaction, walletAccount, password)
  const signedTransactionEnvelope = signedTransaction.toEnvelope().toXDR("base64")

  event.sender.send(events.signTransactionEvent, { messageID, result: signedTransactionEnvelope })
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
