import { Transaction } from "stellar-sdk"
import { Messages } from "../shared/ipc"
import { call } from "./ipc"

export interface KeyStoreAPI {
  getKeyIDs(): Promise<string[]>
  getPublicKeyData(keyID: string): Promise<PublicKeyData>
  getPrivateKeyData(keyID: string, password: string): Promise<PrivateKeyData>
  saveKey(keyID: string, password: string, privateData: PrivateKeyData, publicData?: PublicKeyData): Promise<void>
  savePublicKeyData(keyID: string, publicData: PublicKeyData): Promise<void>
  signTransaction(internalAccountID: string, transaction: Transaction, password: string): Promise<Transaction>
  signTransactionWithHardwareWallet(
    walletID: string,
    accountIndex: number,
    transaction: Transaction
  ): Promise<Transaction>
  removeKey(keyID: string): Promise<void>
}

const keyStore: KeyStoreAPI = {
  getKeyIDs: () => call(Messages.GetKeyIDs),
  getPublicKeyData: keyID => call(Messages.GetPublicKeyData, keyID),
  getPrivateKeyData: (keyID, password) => call(Messages.GetPrivateKeyData, keyID, password),
  signTransaction: async (accountID, transaction, password) => {
    const txXDR = transaction.toEnvelope().toXDR("base64")
    const signedXDR = await call(Messages.SignTransaction, accountID, txXDR, password)
    return new Transaction(signedXDR, transaction.networkPassphrase)
  },
  signTransactionWithHardwareWallet: async (walletID, accountIndex, transaction) => {
    const txXDR = transaction
      .toEnvelope()
      .toXDR("base64")
      .toString("base64")
    const signedXDR = await call(Messages.SignTransactionWithHardwareWallet, walletID, accountIndex, txXDR)
    return new Transaction(signedXDR)
  },
  saveKey: (keyID, password, privateData, publicData) =>
    call(Messages.SaveKey, keyID, password, privateData, publicData),
  savePublicKeyData: (keyID, publicData) => call(Messages.SavePublicKeyData, keyID, publicData),
  removeKey: keyID => call(Messages.RemoveKey, keyID)
}

export default function getKeyStore(): KeyStoreAPI {
  return keyStore
}
