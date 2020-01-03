import isDev from "electron-is-dev"
import Store from "electron-store"
import { createStore } from "key-store"
import generateID from "nanoid/generate"
import { Keypair, Networks, Transaction } from "stellar-sdk"
import { expose } from "./_ipc"
import { Messages } from "../shared/ipc"

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

expose(Messages.GetKeyIDs, function getKeyIDs() {
  return keystore.getKeyIDs()
})

expose(Messages.GetPublicKeyData, function getPublicKeyData(keyID) {
  return keystore.getPublicKeyData(keyID)
})

expose(Messages.GetPrivateKeyData, function getPrivateKeyData(keyID, password) {
  return keystore.getPrivateKeyData(keyID, password)
})

expose(Messages.SaveKey, function saveKey(keyID, password, privateData, publicData?) {
  return keystore.saveKey(keyID, password, privateData, publicData)
})

expose(Messages.SavePublicKeyData, function saveKey(keyID, publicData) {
  return keystore.savePublicKeyData(keyID, publicData)
})

expose(Messages.RemoveKey, function removeKey(keyID) {
  return keystore.removeKey(keyID)
})

expose(Messages.SignTransaction, function signTransaction(internalAccountID, transactionXDR, password) {
  try {
    const account = keystore.getPublicKeyData(internalAccountID)
    const networkPassphrase = account.testnet ? Networks.TESTNET : Networks.PUBLIC
    const transaction = new Transaction(transactionXDR, networkPassphrase)

    const privateKey = keystore.getPrivateKeyData(internalAccountID, password).privateKey

    transaction.sign(Keypair.fromSecret(privateKey))

    return transaction
      .toEnvelope()
      .toXDR()
      .toString("base64")
  } catch (error) {
    throw Object.assign(new Error("Wrong password."), { name: "WrongPasswordError" })
  }
})

/////////////
// Settings:

expose(Messages.ReadSettings, function readSettings() {
  return mainStore.has("settings") ? mainStore.get("settings") : {}
})

expose(Messages.StoreSettings, function storeSettings(updatedSettings: Partial<Platform.SettingsData>) {
  const prevSettings = mainStore.has("settings") ? mainStore.get("settings") : {}
  mainStore.set("settings", { ...prevSettings, ...updatedSettings })
  return true
})

//////////////////
// Dismissed txs:

expose(Messages.ReadIgnoredSignatureRequestHashes, function readIgnoredSignatureRequestHashes() {
  return mainStore.has("ignoredSignatureRequests") ? mainStore.get("ignoredSignatureRequests") : []
})

expose(Messages.StoreIgnoredSignatureRequestHashes, function storeIgnoredSignatureRequestHashes(
  updatedHashes: string[]
) {
  mainStore.set("ignoredSignatureRequests", updatedHashes)
  return true
})
