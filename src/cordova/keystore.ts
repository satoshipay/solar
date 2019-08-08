import { KeyStore } from "key-store"
import { Transaction, Network, Keypair } from "stellar-sdk"
import { Account } from "../context/accounts"
import { CommandHandlers, registerCommandHandler } from "./ipc"

export const commands = {
  getKeyIDsCommand: "keystore:getKeyIDs",
  getPublicKeyDataCommand: "keystore:getPublicKeyData",
  getPrivateKeyDataCommand: "keystore:getPrivateKeyData",
  saveKeyCommand: "keystore:saveKey",
  savePublicKeyDataCommand: "keystore:savePublicKeyData",
  signTransactionCommand: "keystore:signTransaction",
  removeKeyCommand: "keystore:removeKey"
}

export const events = {
  getKeyIDsEvent: "keystore:keyIDs",
  getPublicKeyDataEvent: "keystore:publicKeyData",
  getPrivateKeyDataEvent: "keystore:privateKeyData",
  saveKeyEvent: "keystore:savedKey",
  savePublicKeyDataEvent: "keystore:savedPublicKeyData",
  signTransactionEvent: "keystore:signedTransaction",
  removeKeyEvent: "keystore:removedKey"
}

export const commandHandlers: CommandHandlers = {
  [commands.getKeyIDsCommand]: respondWithKeyIDs,
  [commands.getPublicKeyDataCommand]: respondWithPublicKeyData,
  [commands.getPrivateKeyDataCommand]: respondWithPrivateKeyData,
  [commands.saveKeyCommand]: saveKey,
  [commands.savePublicKeyDataCommand]: savePublicKeyData,
  [commands.signTransactionCommand]: respondWithSignedTransaction,
  [commands.removeKeyCommand]: removeKey
}

export function registerKeyStoreCommandHandlers() {
  Object.keys(commandHandlers).forEach(key => {
    registerCommandHandler(key, commandHandlers[key])
  })
}

async function respondWithKeyIDs(
  event: MessageEvent,
  contentWindow: Window,
  secureStorage: CordovaSecureStorage,
  keyStore: KeyStore<PrivateKeyData, PublicKeyData>
) {
  const keyIDs = keyStore.getKeyIDs()
  contentWindow.postMessage({ eventType: events.getKeyIDsEvent, id: event.data.id, result: keyIDs }, "*")
}

async function respondWithPublicKeyData(
  event: MessageEvent,
  contentWindow: Window,
  secureStorage: CordovaSecureStorage,
  keyStore: KeyStore<PrivateKeyData, PublicKeyData>
) {
  const { keyID } = event.data

  const publicKeyData = keyStore.getPublicKeyData(keyID)
  contentWindow.postMessage({ eventType: events.getPublicKeyDataEvent, id: event.data.id, result: publicKeyData }, "*")
}

async function respondWithPrivateKeyData(
  event: MessageEvent,
  contentWindow: Window,
  secureStorage: CordovaSecureStorage,
  keyStore: KeyStore<PrivateKeyData, PublicKeyData>
) {
  const { keyID, password } = event.data
  const privateKeyData = keyStore.getPrivateKeyData(keyID, password)
  contentWindow.postMessage(
    { eventType: events.getPrivateKeyDataEvent, id: event.data.id, result: privateKeyData },
    "*"
  )
}

async function saveKey(
  event: MessageEvent,
  contentWindow: Window,
  secureStorage: CordovaSecureStorage,
  keyStore: KeyStore<PrivateKeyData, PublicKeyData>
) {
  const { keyID, password, privateData, publicData } = event.data

  keyStore.saveKey(keyID, password, privateData, publicData)
  contentWindow.postMessage({ eventType: events.saveKeyEvent, id: event.data.id }, "*")
}

async function savePublicKeyData(
  event: MessageEvent,
  contentWindow: Window,
  secureStorage: CordovaSecureStorage,
  keyStore: KeyStore<PrivateKeyData, PublicKeyData>
) {
  const { keyID, publicData } = event.data

  keyStore.savePublicKeyData(keyID, publicData)
  contentWindow.postMessage({ eventType: events.savePublicKeyDataEvent, id: event.data.id }, "*")
}

async function removeKey(
  event: MessageEvent,
  contentWindow: Window,
  secureStorage: CordovaSecureStorage,
  keyStore: KeyStore<PrivateKeyData, PublicKeyData>
) {
  const { keyID } = event.data

  keyStore.removeKey(keyID)
  contentWindow.postMessage({ eventType: events.removeKeyEvent, id: event.data.id }, "*")
}

async function respondWithSignedTransaction(
  event: MessageEvent,
  contentWindow: Window,
  secureStorage: CordovaSecureStorage,
  keyStore: KeyStore<PrivateKeyData, PublicKeyData>
) {
  const { keyID, networkPassphrase, password, transactionEnvelope } = event.data

  const transaction = new Transaction(transactionEnvelope)
  const { privateKey } = keyStore.getPrivateKeyData(keyID, password)

  Network.use(new Network(networkPassphrase))
  transaction.sign(Keypair.fromSecret(privateKey))

  const result = transaction.toEnvelope().toXDR("base64")

  contentWindow.postMessage({ eventType: events.removeKeyEvent, id: event.data.id, result }, "*")
}
