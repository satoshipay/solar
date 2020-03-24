import { createHash, randomBytes } from "crypto"
import { createStore } from "key-store"
import { Keypair, Networks, Transaction } from "stellar-sdk"
import { Messages } from "../shared/ipc"
import { expose } from "./_ipc"
import { mainStore } from "./storage"

const AppAuthPolicy = KeyStoreAppKey.AppAuthPolicy
type AppAuthPolicy = KeyStoreAppKey.AppAuthPolicy
const TxAuthPolicy = KeyStoreAccountV1.TxAuthPolicy
type TxAuthPolicy = KeyStoreAccountV1.TxAuthPolicy

type AppKeyData = KeyStoreAppKey.AppKeyData
type PrivateKeyData = KeyStoreAccount.PrivateKeyData
type PublicKeyData = KeyStoreAccount.PublicKeyData

const readKeys = () => (mainStore.has("keys") ? mainStore.get("keys") : {})
const updateKeys = (arg: any) => mainStore.set("keys", arg)

const readAppKeys = () => (mainStore.has("appKeys") ? mainStore.get("appKeys") : {})
const updateAppKeys = (arg: any) => mainStore.set("appKeys", arg)

const appKeyID = "$app"
const appKeyStore = createStore<PrivateKeyData, AppKeyData>(updateAppKeys, readAppKeys())
const keyStore = createStore<PrivateKeyData, PublicKeyData>(updateKeys, readKeys())

function authorize(authPolicy: AppAuthPolicy | TxAuthPolicy, appPassword: string | null): void | never {
  if (authPolicy === AppAuthPolicy.AlwaysPassword) {
    const appKeyMeta = appKeyStore.getPublicKeyData(appKeyID)
    const hash = createPasswordHash(Buffer.from(appPassword || "", "utf-8"), Buffer.from(appKeyMeta.nonce, "base64"))

    if (hash.toString("base64") !== appKeyMeta.passwordHash) {
      throw Object.assign(new Error("Wrong password."), { name: "WrongPasswordError" })
    }
  } else if (authPolicy === TxAuthPolicy.Unprotected) {
    // Do nothing
  } else if (authPolicy === AppAuthPolicy.BiometricAuth || authPolicy === TxAuthPolicy.BiometricAuth) {
    throw Error("Authentication policy not available on this device: " + authPolicy)
  } else {
    throw Error("Invalid app authentication policy: " + authPolicy)
  }
}

function canEncryptKey(appAuthPolicy: AppAuthPolicy, keyTxAuth: TxAuthPolicy) {
  return appAuthPolicy === AppAuthPolicy.AlwaysPassword || keyTxAuth === TxAuthPolicy.AlwaysPassword
}

function createPasswordHash(password: Buffer, nonce: Buffer) {
  const hash = createHash("sha256")
  hash.update(Buffer.concat([nonce, password]))
  return hash.digest()
}

function getEffectivePassword(password: string, appAuthPolicy: AppAuthPolicy, keyTxAuth: TxAuthPolicy | null) {
  return canEncryptKey(appAuthPolicy, keyTxAuth || TxAuthPolicy.Unprotected) ? password : ""
}

function hashPassword(password: string) {
  const nonce = randomBytes(16)
  const passwordHash = createPasswordHash(Buffer.from(password, "utf-8"), nonce)
  return {
    nonce: nonce.toString("base64"),
    passwordHash: passwordHash.toString("base64")
  }
}

function reencryptKey(keyID: string, newPassword: string, prevPassword: string | null, encryptUsingPassword: boolean) {
  const publicData = {
    ...keyStore.getPublicKeyData(keyID),
    password: encryptUsingPassword
  }
  const privateData = keyStore.getPrivateKeyData(keyID, prevPassword || "")
  keyStore.saveKey(keyID, newPassword, privateData, publicData)
}

expose(Messages.CreateKey, function createKey(keyID, password, privateKey, options) {
  const appKeyPublicData = appKeyStore.getPublicKeyData(appKeyID)
  const publicData: KeyStoreAccountV1.PublicKeyData = {
    ...options,
    password: canEncryptKey(appKeyPublicData.authPolicy, options.txAuth),
    version: 1
  }
  const privateData: KeyStoreAccount.PrivateKeyData = { privateKey }
  return keyStore.saveKey(keyID, password, privateData, publicData)
})

expose(Messages.GetAppKeyMetadata, function getAppKeyMetadata() {
  return appKeyStore.getKeyIDs().indexOf(appKeyID) > -1 ? appKeyStore.getPublicKeyData(appKeyID) : null
})

expose(Messages.GetKeyIDs, function getKeyIDs() {
  return keyStore.getKeyIDs()
})

expose(Messages.GetPublicKeyData, function getPublicKeyData(keyID) {
  return keyStore.getPublicKeyData(keyID)
})

expose(Messages.GetPrivateKey, function getPrivateKey(keyID, password) {
  const privateData = keyStore.getPrivateKeyData(keyID, password)
  return privateData.privateKey
})

expose(Messages.HasSetAppPassword, function hasSetAppPassword() {
  return appKeyStore.getKeyIDs().indexOf(appKeyID) > -1
})

expose(Messages.RemoveKey, function removeKey(keyID) {
  return keyStore.removeKey(keyID)
})

expose(Messages.RenameKey, function renameKey(keyID, newName) {
  const publicData = keyStore.getPublicKeyData(keyID)
  return keyStore.savePublicKeyData(keyID, { ...publicData, name: newName })
})

expose(Messages.SetUpAppPassword, function setUpAppPassword(password, privateKey, authPolicy) {
  if (appKeyStore.getKeyIDs().indexOf(appKeyID) > -1) {
    throw Error("App password has been set already.")
  }
  const publicData: AppKeyData = {
    ...hashPassword(password),
    authPolicy,
    version: 1
  }
  return appKeyStore.saveKey(appKeyID, getEffectivePassword(password, authPolicy, null), { privateKey }, publicData)
})

expose(Messages.SignTransaction, function signTransaction(keyID, transactionXDR, password) {
  try {
    const account = keyStore.getPublicKeyData(keyID)
    const networkPassphrase = account.testnet ? Networks.TESTNET : Networks.PUBLIC
    const transaction = new Transaction(transactionXDR, networkPassphrase)

    const privateKey = keyStore.getPrivateKeyData(keyID, password).privateKey

    transaction.sign(Keypair.fromSecret(privateKey))

    return transaction
      .toEnvelope()
      .toXDR()
      .toString("base64")
  } catch (error) {
    throw Object.assign(new Error("Wrong password."), { name: "WrongPasswordError" })
  }
})

expose(Messages.UpdateAppPassword, function updateAppPassword(
  newPassword: string,
  prevPassword: string,
  authPolicy: AppAuthPolicy
) {
  const appKeyMeta = appKeyStore.getPublicKeyData(appKeyID)
  authorize(appKeyMeta.authPolicy, prevPassword)

  const appKeyPublicData: AppKeyData = {
    ...appKeyMeta,
    ...hashPassword(newPassword),
    authPolicy,
    version: 1
  }
  const appKeyPrivateData = appKeyStore.getPrivateKeyData(appKeyID, prevPassword || "")
  appKeyStore.saveKey(
    appKeyID,
    getEffectivePassword(newPassword, authPolicy, null),
    appKeyPrivateData,
    appKeyPublicData
  )

  for (const keyID of keyStore.getKeyIDs()) {
    const publicData = keyStore.getPublicKeyData(keyID)

    if ("version" in publicData && publicData.version >= 1 && publicData.password) {
      const encryptKey = canEncryptKey(appKeyPublicData.authPolicy, publicData.txAuth)
      reencryptKey(keyID, newPassword, prevPassword, encryptKey)
    }
  }
})

expose(Messages.UpdateKeyTxAuth, function updateKeyTxAuth(
  keyID: string,
  txAuth: KeyStoreAccount.TxAuthPolicy,
  password: string | null
) {
  const appKeyMeta = appKeyStore.getPublicKeyData(appKeyID)
  authorize(appKeyMeta.authPolicy, password)

  const prevPublicData = keyStore.getPublicKeyData(keyID)
  const nextPublicData: KeyStoreAccountV1.PublicKeyData = {
    ...prevPublicData,
    password: canEncryptKey(appKeyMeta.authPolicy, txAuth),
    txAuth,
    version: 1
  }

  if (nextPublicData.password && !password) {
    throw Error("Password required.")
  }

  keyStore.savePublicKeyData(keyID, nextPublicData)
  reencryptKey(
    keyID,
    nextPublicData.password ? password! : "",
    prevPublicData.password ? password : "",
    nextPublicData.password
  )
})
