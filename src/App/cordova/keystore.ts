import { KeyStore } from "key-store"
import { Transaction, Keypair, Networks } from "stellar-sdk"
import { Messages } from "~Shared/ipc"
import { WrongPasswordError } from "~Generic/lib/errors"
import { CommandHandlers, expose } from "./ipc"

export const commandHandlers: CommandHandlers = {
  [Messages.GetKeyIDs]: respondWithKeyIDs,
  [Messages.GetPublicKeyData]: respondWithPublicKeyData,
  [Messages.GetPrivateKeyData]: respondWithPrivateKeyData,
  [Messages.SaveKey]: saveKey,
  [Messages.SavePublicKeyData]: savePublicKeyData,
  [Messages.SignTransaction]: respondWithSignedTransaction,
  [Messages.RemoveKey]: removeKey
}

export function registerKeyStoreCommandHandlers() {
  Object.keys(commandHandlers).forEach(key => {
    const messageType = key as keyof typeof IPC.Messages
    const commandHandler = commandHandlers[messageType]
    if (commandHandler) {
      expose(messageType, commandHandler)
    }
  })
}

async function respondWithKeyIDs(
  secureStorage: CordovaSecureStorage,
  keyStore: KeyStore<PrivateKeyData, PublicKeyData>
) {
  const keyIDs = keyStore.getKeyIDs()
  return keyIDs
}

async function respondWithPublicKeyData(
  secureStorage: CordovaSecureStorage,
  keyStore: KeyStore<PrivateKeyData, PublicKeyData>,
  keyID: string
) {
  const publicKeyData = keyStore.getPublicKeyData(keyID)
  return publicKeyData
}

async function respondWithPrivateKeyData(
  secureStorage: CordovaSecureStorage,
  keyStore: KeyStore<PrivateKeyData, PublicKeyData>,
  keyID: string,
  password: string
) {
  const privateKeyData = keyStore.getPrivateKeyData(keyID, password)
  return privateKeyData
}

async function saveKey(
  secureStorage: CordovaSecureStorage,
  keyStore: KeyStore<PrivateKeyData, PublicKeyData>,
  keyID: string,
  password: string,
  privateData: PrivateKeyData,
  publicData?: PublicKeyData
) {
  keyStore.saveKey(keyID, password, privateData, publicData)
}

async function savePublicKeyData(
  secureStorage: CordovaSecureStorage,
  keyStore: KeyStore<PrivateKeyData, PublicKeyData>,
  keyID: string,
  publicData: PublicKeyData
) {
  keyStore.savePublicKeyData(keyID, publicData)
}

async function removeKey(
  secureStorage: CordovaSecureStorage,
  keyStore: KeyStore<PrivateKeyData, PublicKeyData>,
  keyID: string
) {
  keyStore.removeKey(keyID)
}

async function respondWithSignedTransaction(
  secureStorage: CordovaSecureStorage,
  keyStore: KeyStore<PrivateKeyData, PublicKeyData>,
  internalAccountID: string,
  transactionXDR: string,
  password: string
) {
  try {
    const account = keyStore.getPublicKeyData(internalAccountID)
    const networkPassphrase = account.testnet ? Networks.TESTNET : Networks.PUBLIC
    const transaction = new Transaction(transactionXDR, networkPassphrase)

    const privateKey = keyStore.getPrivateKeyData(internalAccountID, password).privateKey

    transaction.sign(Keypair.fromSecret(privateKey))

    return transaction
      .toEnvelope()
      .toXDR()
      .toString("base64")
  } catch (error) {
    throw WrongPasswordError()
  }
}
