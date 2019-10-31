import { call } from "./ipc"
import { Transaction } from "stellar-sdk"

export interface KeyStoreAPI {
  getKeyIDs(): Promise<string[]>
  getPublicKeyData(keyID: string): Promise<PublicKeyData>
  getPrivateKeyData(keyID: string, password: string): Promise<PrivateKeyData>
  saveKey(keyID: string, password: string, privateData: PrivateKeyData, publicData?: PublicKeyData): Promise<void>
  savePublicKeyData(keyID: string, publicData: PublicKeyData): Promise<void>
  signTransaction(internalAccountID: string, transaction: Transaction, password: string): Promise<Transaction>
  removeKey(keyID: string): Promise<void>
}

const keyStore: KeyStoreAPI = {
  getKeyIDs: () => call(IPC.Messages.GetKeyIDs),
  getPublicKeyData: keyID => call(IPC.Messages.GetPublicKeyData, keyID),
  getPrivateKeyData: (keyID, password) => call(IPC.Messages.GetPrivateKeyData, keyID, password),
  signTransaction: async (accountID, transaction, password) => {
    const txXDR = transaction
      .toEnvelope()
      .toXDR("base64")
      .toString("base64")
    const signedXDR = await call(IPC.Messages.SignTransaction, accountID, txXDR, password)
    return new Transaction(signedXDR)
  },
  saveKey: (keyID, password, privateData, publicData) =>
    call(IPC.Messages.SaveKey, keyID, password, privateData, publicData),
  savePublicKeyData: (keyID, publicData) => call(IPC.Messages.SavePublicKeyData, keyID, publicData),
  removeKey: keyID => call(IPC.Messages.RemoveKey, keyID)
}

export default function getKeyStore(): KeyStoreAPI {
  return keyStore
}
