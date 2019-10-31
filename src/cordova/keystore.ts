import { KeyStore } from "key-store"
import { Transaction, Keypair } from "stellar-sdk"
import { CommandHandlers, registerCommandHandler, sendSuccessResponse, sendErrorResponse } from "./ipc"

export const commandHandlers: CommandHandlers = {
  [IPC.Messages.GetKeyIDs]: respondWithKeyIDs,
  [IPC.Messages.GetPublicKeyData]: respondWithPublicKeyData,
  [IPC.Messages.GetPrivateKeyData]: respondWithPrivateKeyData,
  [IPC.Messages.SaveKey]: saveKey,
  [IPC.Messages.SavePublicKeyData]: savePublicKeyData,
  [IPC.Messages.SignTransaction]: respondWithSignedTransaction,
  [IPC.Messages.RemoveKey]: removeKey
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
  sendSuccessResponse(contentWindow, event, keyIDs)
}

async function respondWithPublicKeyData(
  event: MessageEvent,
  contentWindow: Window,
  secureStorage: CordovaSecureStorage,
  keyStore: KeyStore<PrivateKeyData, PublicKeyData>
) {
  const { keyID } = event.data

  const publicKeyData = keyStore.getPublicKeyData(keyID)
  sendSuccessResponse(contentWindow, event, publicKeyData)
}

async function respondWithPrivateKeyData(
  event: MessageEvent,
  contentWindow: Window,
  secureStorage: CordovaSecureStorage,
  keyStore: KeyStore<PrivateKeyData, PublicKeyData>
) {
  const { keyID, password } = event.data
  const privateKeyData = keyStore.getPrivateKeyData(keyID, password)
  sendSuccessResponse(contentWindow, event, privateKeyData)
}

async function saveKey(
  event: MessageEvent,
  contentWindow: Window,
  secureStorage: CordovaSecureStorage,
  keyStore: KeyStore<PrivateKeyData, PublicKeyData>
) {
  const { keyID, password, privateData, publicData } = event.data

  keyStore.saveKey(keyID, password, privateData, publicData)
  sendSuccessResponse(contentWindow, event)
}

async function savePublicKeyData(
  event: MessageEvent,
  contentWindow: Window,
  secureStorage: CordovaSecureStorage,
  keyStore: KeyStore<PrivateKeyData, PublicKeyData>
) {
  const { keyID, publicData } = event.data

  keyStore.savePublicKeyData(keyID, publicData)
  sendSuccessResponse(contentWindow, event)
}

async function removeKey(
  event: MessageEvent,
  contentWindow: Window,
  secureStorage: CordovaSecureStorage,
  keyStore: KeyStore<PrivateKeyData, PublicKeyData>
) {
  const { keyID } = event.data

  keyStore.removeKey(keyID)
  sendSuccessResponse(contentWindow, event)
}

async function respondWithSignedTransaction(
  event: MessageEvent,
  contentWindow: Window,
  secureStorage: CordovaSecureStorage,
  keyStore: KeyStore<PrivateKeyData, PublicKeyData>
) {
  const { keyID, networkPassphrase, password, transactionEnvelope } = event.data

  const transaction = new Transaction(transactionEnvelope, networkPassphrase)

  let privateKey: string
  try {
    privateKey = keyStore.getPrivateKeyData(keyID, password).privateKey
  } catch (error) {
    // tslint:disable-next-line:no-console
    console.debug("Decrypting private key data failed. Assuming wrong password:", error)
    sendErrorResponse(contentWindow, event, "Wrong password")
    return
  }

  transaction.sign(Keypair.fromSecret(privateKey))
  const result = transaction.toEnvelope().toXDR("base64")

  sendSuccessResponse(contentWindow, event, result)
}
