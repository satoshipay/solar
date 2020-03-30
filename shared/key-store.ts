/// <reference types="./types/ipc" />
/// <reference types="./types/keystore" />

import { Buffer } from "buffer"
import { Keypair, Networks, Transaction } from "stellar-sdk"
import { Messages } from "./ipc"

const AppAuthPolicy = KeyStoreAppKey.AppAuthPolicy
type AppAuthPolicy = KeyStoreAppKey.AppAuthPolicy
type AppKeyData = KeyStoreAppKey.AppKeyData
const TxAuthPolicy = KeyStoreAccountV1.TxAuthPolicy
type TxAuthPolicy = KeyStoreAccountV1.TxAuthPolicy

export interface AppKey {
  decryptPrivateKey(password: string | null): Promise<string>
  getData(): Promise<KeyStoreAppKey.AppKeyData>
  hasBeenSet(): Promise<boolean>
  reencryptKey(
    newPassword: string | null,
    prevPassword: string | null,
    publicData: KeyStoreAppKey.AppKeyData
  ): Promise<void>
  save(privateKey: string, publicData: KeyStoreAppKey.AppKeyData, password: string | null): Promise<void>
  updateData(updatedData: KeyStoreAppKey.AppKeyData): Promise<void>
}

export interface AuthorizeFn {
  (authPolicy: AppAuthPolicy | TxAuthPolicy, appPassword: string | null): Promise<void | never>
}

export interface Crypto {
  createPasswordHash(password: Buffer, nonce: Buffer): Promise<Buffer>
  randomBytes(bytes: number): Promise<Buffer>
}

export interface ExposeFn {
  <Message extends keyof IPC.MessageType>(
    messageType: Message,
    handler: (
      ...args: IPC.MessageArgs<Message>
    ) => IPC.MessageReturnType<Message> | Promise<IPC.MessageReturnType<Message>>
  ): void
}

export interface Store<Public> {
  allKeyIDs(): Promise<string[]>
  decryptKey(keyID: string, password: string | null): Promise<string>
  getPublicData(keyID: string): Promise<Public>
  reencryptKey(keyID: string, newPassword: string | null, prevPassword: string | null): Promise<void>
  removeKey(keyID: string): Promise<void>
  saveKey(
    keyID: string,
    password: string | null,
    privateKey: string,
    publicData: Omit<Public, "password">
  ): Promise<Public>
  updatePublicData(keyID: string, updatedData: Public): Promise<void>
}

function canEncryptKey(appAuthPolicy: AppAuthPolicy, keyTxAuth: TxAuthPolicy) {
  return appAuthPolicy === AppAuthPolicy.AlwaysPassword || keyTxAuth === TxAuthPolicy.AlwaysPassword
}

function getEffectivePassword(password: string, appAuthPolicy: AppAuthPolicy, keyTxAuth: TxAuthPolicy | null) {
  return canEncryptKey(appAuthPolicy, keyTxAuth || TxAuthPolicy.Unprotected) ? password : null
}

async function hashPassword(crypto: Crypto, password: string) {
  const nonce = await crypto.randomBytes(16)
  const passwordHash = await crypto.createPasswordHash(Buffer.from(password, "utf-8"), nonce)
  return {
    nonce: nonce.toString("base64"),
    passwordHash: passwordHash.toString("base64")
  }
}

function UnauthorizedError(message: string) {
  return Object.assign(new Error(message), { name: "UnauthorizedError" })
}

export function bootstrapKeyStore(
  store: Store<KeyStoreAccount.PublicKeyData>,
  appKey: AppKey,
  authorize: AuthorizeFn,
  crypto: Crypto,
  expose: ExposeFn
) {
  expose(Messages.CreateKey, async function createKey(keyID, password, privateKey, options) {
    const appKeyPublicData = await appKey.getData()
    const publicData: KeyStoreAccountV1.PublicKeyData = {
      ...options,
      password: canEncryptKey(appKeyPublicData.authPolicy, options.txAuth),
      version: 1
    }
    await store.saveKey(keyID, password, privateKey, publicData)
  })

  expose(Messages.GetAppKeyMetadata, async function getAppKeyMetadata() {
    return (await appKey.hasBeenSet()) ? appKey.getData() : null
  })

  expose(Messages.GetKeyIDs, function getKeyIDs() {
    return store.allKeyIDs()
  })

  expose(Messages.GetPublicKeyData, function getPublicKeyData(keyID) {
    return store.getPublicData(keyID)
  })

  expose(Messages.GetPrivateKey, function getPrivateKey(keyID, password) {
    return store.decryptKey(keyID, password)
  })

  expose(Messages.HasSetAppPassword, function hasSetAppPassword() {
    return appKey.hasBeenSet()
  })

  expose(Messages.RemoveKey, function removeKey(keyID) {
    return store.removeKey(keyID)
  })

  expose(Messages.RenameKey, async function renameKey(keyID, newName) {
    const publicData = await store.getPublicData(keyID)
    return store.updatePublicData(keyID, { ...publicData, name: newName })
  })

  expose(Messages.SetUpAppPassword, async function setUpAppPassword(password, privateKey, authPolicy) {
    if (await appKey.hasBeenSet()) {
      throw Error("App password has been set already.")
    }
    const publicData: KeyStoreAppKey.AppKeyData = {
      ...(await hashPassword(crypto, password)),
      authPolicy,
      version: 1
    }
    return appKey.save(privateKey, publicData, getEffectivePassword(password, authPolicy, null))
  })

  expose(Messages.SignTransaction, async function signTransaction(keyID, transactionXDR, password) {
    const account = await store.getPublicData(keyID)
    const networkPassphrase = account.testnet ? Networks.TESTNET : Networks.PUBLIC
    const transaction = new Transaction(transactionXDR, networkPassphrase)

    try {
      const privateKey = await store.decryptKey(keyID, password)
      transaction.sign(Keypair.fromSecret(privateKey))

      return transaction
        .toEnvelope()
        .toXDR()
        .toString("base64")
    } catch (error) {
      throw UnauthorizedError("Wrong password.")
    }
  })

  expose(Messages.UpdateAppPassword, async function updateAppPassword(
    newPassword: string,
    prevPassword: string,
    authPolicy: AppAuthPolicy
  ) {
    const appKeyMeta = await appKey.getData()
    authorize(appKeyMeta.authPolicy, prevPassword)

    const appKeyPublicData: AppKeyData = {
      ...appKeyMeta,
      ...hashPassword(crypto, newPassword),
      authPolicy,
      version: 1
    }

    await appKey.reencryptKey(newPassword, prevPassword, appKeyPublicData)

    await Promise.all(
      (await store.allKeyIDs()).map(async keyID => {
        const publicData = await store.getPublicData(keyID)

        if ("version" in publicData && publicData.version >= 1 && publicData.password) {
          const encryptKey = canEncryptKey(appKeyPublicData.authPolicy, publicData.txAuth)
          await store.reencryptKey(keyID, encryptKey ? newPassword : null, prevPassword)
        }
      })
    )
  })

  /** @deprecated */
  expose(Messages.UpdateKeyPassword, async function updateKeyPassword(
    keyID: string,
    newPassword: string,
    prevPassword: string
  ) {
    const publicData = await store.getPublicData(keyID)

    if ("version" in publicData && publicData.version >= 1) {
      throw Object.assign(Error(`Cannot change password for a version 1+ key: ${keyID}`), { name: "VersionError" })
    }

    await store.reencryptKey(keyID, newPassword, prevPassword)
  })

  expose(Messages.UpdateKeyTxAuth, async function updateKeyTxAuth(
    keyID: string,
    txAuth: KeyStoreAccount.TxAuthPolicy,
    password: string | null
  ) {
    const appKeyMeta = await appKey.getData()
    authorize(appKeyMeta.authPolicy, password)

    const prevPublicData = await store.getPublicData(keyID)
    const nextPublicData: KeyStoreAccountV1.PublicKeyData = {
      ...prevPublicData,
      password: canEncryptKey(appKeyMeta.authPolicy, txAuth),
      txAuth,
      version: 1
    }

    if (nextPublicData.password && !password) {
      throw UnauthorizedError("Password required.")
    }

    await store.updatePublicData(keyID, nextPublicData)
    await store.reencryptKey(
      keyID,
      nextPublicData.password ? password! : null,
      prevPublicData.password ? password : null
    )
  })
}
