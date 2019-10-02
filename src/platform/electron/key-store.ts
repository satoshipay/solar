import { KeyStoreAPI } from "../types"
import { Transaction } from "stellar-sdk"
import { Account } from "../../context/accounts"
import { networkPassphrases } from "../../lib/stellar"

export default async function createKeyStore(): Promise<KeyStoreAPI> {
  const electron = window.electron
  if (!electron) {
    throw new Error("No electron runtime context available.")
  }
  return {
    async getKeyIDs() {
      return electron.getKeyIDs()
    },
    async getPublicKeyData(keyID: string) {
      return electron.getPublicKeyData(keyID)
    },
    async getPrivateKeyData(keyID: string, password: string) {
      return electron.getPrivateKeyData(keyID, password)
    },
    async saveKey(keyID: string, password: string, privateData: PrivateKeyData, publicData?: PublicKeyData) {
      return electron.saveKey(keyID, password, privateData, publicData)
    },
    async savePublicKeyData(keyID: string, publicData: PublicKeyData) {
      return electron.savePublicKeyData(keyID, publicData)
    },
    async signTransaction(transaction: Transaction, account: Account, password: string) {
      const transactionEnvelope = (transaction.toEnvelope().toXDR("base64") as unknown) as string
      const networkPassphrase = account.testnet ? networkPassphrases.testnet : networkPassphrases.mainnet
      const signedTransactionEnvelope = await electron.signTransaction(
        transactionEnvelope,
        account.id,
        networkPassphrase,
        password
      )
      return new Transaction(signedTransactionEnvelope, networkPassphrase)
    },
    async removeKey(keyID: string) {
      return electron.removeKey(keyID)
    }
  }
}
