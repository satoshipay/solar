import { KeyStoreAPI } from "../types"
import { Transaction } from "stellar-sdk"
import { Account } from "../../context/accounts"

export default async function createKeyStore(): Promise<KeyStoreAPI> {
  if (!window.electron) {
    throw new Error("No electron runtime context available.")
  }
  return {
    async getKeyIDs() {
      return window.electron!.getKeyIDs()
    },
    async getPublicKeyData(keyID: string) {
      return window.electron!.getPublicKeyData(keyID)
    },
    async getPrivateKeyData(keyID: string, password: string) {
      return window.electron!.getPrivateKeyData(keyID, password)
    },
    async saveKey(keyID: string, password: string, privateData: PrivateKeyData, publicData?: PublicKeyData) {
      return window.electron!.saveKey(keyID, password, privateData, publicData)
    },
    async savePublicKeyData(keyID: string, publicData: PublicKeyData) {
      return window.electron!.savePublicKeyData(keyID, publicData)
    },
    async signTransaction(transaction: Transaction, walletAccount: Account, password: string) {
      const transactionEnvelope = transaction.toEnvelope().toXDR("base64")
      const signedTransactionEnvelope = await window.electron!.signTransaction(
        transactionEnvelope,
        walletAccount,
        password
      )
      return new Transaction(signedTransactionEnvelope)
    },
    async removeKey(keyID: string) {
      return window.electron!.removeKey(keyID)
    }
  }
}
