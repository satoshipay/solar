import { commands } from "../../cordova/ipc"
import { KeyStoreAPI } from "../types"
import { sendCommand } from "./message-handler"
import { Transaction } from "stellar-sdk"
import { Account } from "../../context/accounts"

export default async function createKeyStore(): Promise<KeyStoreAPI> {
  return {
    async getKeyIDs() {
      const event = await sendCommand(commands.keyStore.getKeyIDsCommand)
      return event.data.result
    },
    async getPublicKeyData(keyID: string) {
      const data = { keyID }
      const event = await sendCommand(commands.keyStore.getPublicKeyDataCommand, data)
      return event.data.result
    },
    async getPrivateKeyData(keyID: string, password: string) {
      const data = { keyID, password }
      const event = await sendCommand(commands.keyStore.getPrivateKeyDataCommand, data)
      return event.data.result
    },
    async saveKey(keyID: string, password: string, privateData: PrivateKeyData, publicData?: PublicKeyData) {
      const data = { keyID, password, privateData, publicData }
      await sendCommand(commands.keyStore.saveKeyCommand, data)
    },
    async savePublicKeyData(keyID: string, publicData: PublicKeyData) {
      const data = { keyID, publicData }
      await sendCommand(commands.keyStore.savePublicKeyDataCommand, data)
    },
    async signTransaction(transaction: Transaction, walletAccount: Account, password: string) {
      const transactionEnvelope = transaction.toEnvelope().toXDR("base64")
      const stringifiedAccount = JSON.stringify(walletAccount)
      const data = { transactionEnvelope, stringifiedAccount, password }

      const event = await sendCommand(commands.keyStore.signTransactionCommand, data)
      const signedTransactionEnvelope = event.data.result
      return new Transaction(signedTransactionEnvelope)
    },
    async removeKey(keyID: string) {
      const data = { keyID }
      await sendCommand(commands.keyStore.removeKeyCommand, data)
    }
  }
}
