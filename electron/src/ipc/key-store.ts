import { createHash, randomBytes } from "crypto"
import { createStore } from "key-store"
import { bootstrapKeyStore, AppKey, Crypto, Store } from "../shared/key-store"
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

async function authorize(authPolicy: AppAuthPolicy | TxAuthPolicy, appPassword: string | null): Promise<void | never> {
  if (authPolicy === AppAuthPolicy.AlwaysPassword || authPolicy === TxAuthPolicy.AlwaysPassword) {
    const appKeyMeta = appKeyStore.getPublicKeyData(appKeyID)
    const hash = await createPasswordHash(
      Buffer.from(appPassword || "", "utf-8"),
      Buffer.from(appKeyMeta.nonce, "base64")
    )

    if (hash.toString("base64") !== appKeyMeta.passwordHash) {
      throw Object.assign(new Error("Wrong password."), { name: "UnauthorizedError" })
    }
  } else if (authPolicy === TxAuthPolicy.Unprotected) {
    // Do nothing
  } else if (authPolicy === AppAuthPolicy.BiometricAuth || authPolicy === TxAuthPolicy.BiometricAuth) {
    throw Error("Authentication policy not available on this device: " + authPolicy)
  } else {
    throw Error("Invalid app authentication policy: " + authPolicy)
  }
}

async function createPasswordHash(password: Buffer, nonce: Buffer) {
  const hash = createHash("sha256")
  hash.update(Buffer.concat([nonce, password]))
  return hash.digest()
}

const crypto: Crypto = {
  createPasswordHash,
  randomBytes: async size => randomBytes(size)
}

const appKey: AppKey = {
  async decryptPrivateKey(password) {
    const privateData = appKeyStore.getPrivateKeyData(appKeyID, password || "")
    return privateData.privateKey
  },
  async getData() {
    return appKeyStore.getPublicKeyData(appKeyID)
  },
  async hasBeenSet() {
    const keyIDs = appKeyStore.getKeyIDs()
    return keyIDs.indexOf(appKeyID) > -1
  },
  async reencryptKey(newPassword, prevPassword, publicData) {
    const privateData = appKeyStore.getPrivateKeyData(appKeyID, prevPassword || "")
    await appKeyStore.saveKey(appKeyID, newPassword || "", privateData, publicData)
  },
  async save(privateKey, publicData, password) {
    await appKeyStore.saveKey(appKeyID, password || "", { privateKey }, publicData)
  },
  async updateData(updatedData) {
    await appKeyStore.savePublicKeyData(appKeyID, updatedData)
  }
}

const store: Store<KeyStoreAccount.PublicKeyData> = {
  async allKeyIDs() {
    return keyStore.getKeyIDs()
  },
  async decryptKey(keyID, password) {
    const privateData = keyStore.getPrivateKeyData(keyID, password || "")
    return privateData.privateKey
  },
  async getPublicData(keyID) {
    return keyStore.getPublicKeyData(keyID)
  },
  async reencryptKey(keyID, newPassword, prevPassword) {
    const publicData = {
      ...keyStore.getPublicKeyData(keyID),
      password: Boolean(newPassword)
    }
    const privateData = keyStore.getPrivateKeyData(keyID, prevPassword || "")
    await keyStore.saveKey(keyID, newPassword || "", privateData, publicData)
  },
  async removeKey(keyID: string) {
    await keyStore.removeKey(keyID)
  },
  async saveKey(keyID, password, privateKey, publicDataBlueprint) {
    const publicData: KeyStoreAccount.PublicKeyData = {
      ...publicDataBlueprint,
      password: Boolean(password)
    }
    await keyStore.saveKey(keyID, password || "", { privateKey }, publicData)
    return publicData
  },
  async updatePublicData(keyID, updatedData) {
    await keyStore.savePublicKeyData(keyID, updatedData)
  }
}

bootstrapKeyStore(store, appKey, authorize, crypto, expose)
