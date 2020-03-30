import { KeyStore } from "key-store"
import { Transaction, Keypair, Networks } from "stellar-sdk"
import { WrongPasswordError } from "~Generic/lib/errors"
import { Messages } from "~shared/ipc"
import { bootstrapKeyStore, AppKey, AuthorizeFn, Crypto, Store } from "~shared/key-store"
import { bioAuthenticate } from "./bio-auth"
import { expose, CommandHandlers } from "./ipc"

const AppAuthPolicy = KeyStoreAppKey.AppAuthPolicy
type AppAuthPolicy = KeyStoreAppKey.AppAuthPolicy
const TxAuthPolicy = KeyStoreAccountV1.TxAuthPolicy
type TxAuthPolicy = KeyStoreAccountV1.TxAuthPolicy

type AppKeyData = KeyStoreAppKey.AppKeyData
type PrivateKeyData = KeyStoreAccount.PrivateKeyData
type PublicKeyData = KeyStoreAccount.PublicKeyData

async function createPasswordHash(password: Buffer, nonce: Buffer) {
  const hash = await window.crypto.subtle.digest("SHA-256", Buffer.concat([nonce, password]))
  return new Buffer(hash)
}

async function randomBytes(size: number) {
  const arrayBuffer = new Uint8Array(size)
  window.crypto.getRandomValues(arrayBuffer)
  return new Buffer(arrayBuffer)
}

const crypto: Crypto = {
  createPasswordHash,
  randomBytes
}

export function registerKeyStoreCommandHandlers(
  secureStorage: CordovaSecureStorage,
  keyStore: KeyStore<KeyStoreAccount.PrivateKeyData, KeyStoreAccount.PublicKeyData>
) {
  const appKey: AppKey = {}

  const store: Store<KeyStoreAccount.PublicKeyData> = {}

  const authorize: AuthorizeFn = async (authPolicy, appPassword) => {
    if (authPolicy === AppAuthPolicy.AlwaysPassword || authPolicy === TxAuthPolicy.AlwaysPassword) {
      const appKeyMeta = await appKey.getData()
      const hash = await createPasswordHash(
        Buffer.from(appPassword || "", "utf-8"),
        Buffer.from(appKeyMeta.nonce, "base64")
      )

      if (hash.toString("base64") !== appKeyMeta.passwordHash) {
        throw Object.assign(new Error("Wrong password."), { name: "UnauthorizedError" })
      }
    } else if (authPolicy === AppAuthPolicy.BiometricAuth || authPolicy === TxAuthPolicy.BiometricAuth) {
      await bioAuthenticate()
    } else if (authPolicy === TxAuthPolicy.Unprotected) {
      // Do nothing
    } else {
      throw Error("Invalid app authentication policy: " + authPolicy)
    }
  }
  bootstrapKeyStore(store, appKey, authorize, crypto, expose)
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
