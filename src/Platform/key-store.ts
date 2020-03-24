import { Transaction } from "stellar-sdk"
import { Messages } from "../Shared/ipc"
import { call } from "./ipc"

export interface KeyStoreAPI {
  createKey(
    keyID: string,
    password: string,
    privateKey: string,
    options: Pick<KeyStoreAccountV1.PublicKeyData, "name" | "publicKey" | "testnet" | "txAuth">
  ): Promise<void>
  getAppKeyMetadata(): Promise<KeyStoreAppKey.AppKeyData | null>
  getKeyIDs(): Promise<string[]>
  getPublicKeyData(keyID: string): Promise<KeyStoreAccount.PublicKeyData>
  getPrivateKey(keyID: string, password: string): Promise<string>
  hasSetAppPassword(): Promise<boolean>
  removeKey(keyID: string): Promise<void>
  renameKey(keyID: string, newName: string): Promise<void>
  setUpAppPassword(password: string, privateKey: string, policy: KeyStoreAppKey.AppAuthPolicy): Promise<void>
  signTransaction(internalAccountID: string, transaction: Transaction, password: string): Promise<Transaction>
  updateAppPassword(newPassword: string, prevPassword: string, policy: KeyStoreAppKey.AppAuthPolicy): Promise<void>
  updateKeyTxAuth(keyID: string, policy: KeyStoreAccount.TxAuthPolicy, password: string | null): Promise<void>
}

const keyStore: KeyStoreAPI = {
  createKey: (keyID, password, privateKey, publicData) =>
    call(Messages.CreateKey, keyID, password, privateKey, publicData),
  getAppKeyMetadata: () => call(Messages.GetAppKeyMetadata),
  getKeyIDs: () => call(Messages.GetKeyIDs),
  getPublicKeyData: keyID => call(Messages.GetPublicKeyData, keyID),
  getPrivateKey: (keyID, password) => call(Messages.GetPrivateKey, keyID, password),
  hasSetAppPassword: () => call(Messages.HasSetAppPassword),
  removeKey: keyID => call(Messages.RemoveKey, keyID),
  renameKey: (keyID, newName) => call(Messages.RenameKey, keyID, newName),
  setUpAppPassword: (password, privateKey, policy) => call(Messages.SetUpAppPassword, password, privateKey, policy),
  signTransaction: async (accountID, transaction, password) => {
    const txXDR = transaction
      .toEnvelope()
      .toXDR("base64")
      .toString("base64")
    const signedXDR = await call(Messages.SignTransaction, accountID, txXDR, password)
    return new Transaction(signedXDR)
  },
  updateAppPassword: (newPassword: string, prevPassword: string, policy: KeyStoreAppKey.AppAuthPolicy) =>
    call(Messages.UpdateAppPassword, newPassword, prevPassword, policy),
  updateKeyTxAuth: (keyID, policy, password) => call(Messages.UpdateKeyTxAuth, keyID, policy, password || null)
}

export default function getKeyStore(): KeyStoreAPI {
  return keyStore
}
