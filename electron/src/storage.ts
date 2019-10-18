import { ipcMain } from "electron"
import isDev from "electron-is-dev"
import Store from "electron-store"
import { createStore } from "key-store"
import generateID from "nanoid/generate"
import { Keypair, Transaction } from "stellar-sdk"
import { commands, events, expose } from "./ipc"

// Use different key stores for development and production
const mainStore = new Store({
  name: isDev ? "development" : "config"
})

const readKeys = () => {
  return mainStore.has("keys") ? mainStore.get("keys") : {}
}

const updateKeys = (arg: any) => {
  mainStore.set("keys", arg)
}

const keystore = createStore<PrivateKeyData, PublicKeyData>(updateKeys, readKeys())

export function readInstallationID() {
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
  const transaction = new Transaction(txEnvelopeXdr, networkPassphrase)
  let privateKey
  try {
    privateKey = keystore.getPrivateKeyData(keyID, password).privateKey
  } catch (error) {
    throw Object.assign(new Error("Wrong password."), { name: "WrongPasswordError" })
  }

  transaction.sign(Keypair.fromSecret(privateKey))

  return transaction.toEnvelope().toXDR("base64")
})

/////////////
// Settings:

ipcMain.on("storage:settings:readSync", (event: Electron.Event) => {
  event.returnValue = mainStore.has("settings") ? mainStore.get("settings") : {}
})

ipcMain.on("storage:settings:storeSync", (event: Electron.Event, updatedSettings: Partial<SettingsData>) => {
  const prevSettings = mainStore.has("settings") ? mainStore.get("settings") : {}
  mainStore.set("settings", { ...prevSettings, ...updatedSettings })
  event.returnValue = true
})

//////////////////
// Dismissed txs:

ipcMain.on("storage:ignoredSignatureRequests:readSync", (event: Electron.Event) => {
  event.returnValue = mainStore.has("ignoredSignatureRequests") ? mainStore.get("ignoredSignatureRequests") : []
})

ipcMain.on("storage:ignoredSignatureRequests:storeSync", (event: Electron.Event, updatedHashes: string[]) => {
  mainStore.set("ignoredSignatureRequests", updatedHashes)
  event.returnValue = true
})
