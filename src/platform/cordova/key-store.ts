import { commands } from "../../cordova/ipc"
import { KeyStoreAPI } from "../types"
import { sendCommand } from "./message-handler"
import { Transaction } from "stellar-sdk"
import { Account } from "../../context/accounts"

export default async function createKeyStore(): Promise<KeyStoreAPI> {
  return {
    async getKeyIDs() {
      const event = await sendCommand(commands.getKeyIDsCommand)
      return event.data.result
    },
    async getPublicKeyData(keyID: string) {
      const data = { keyID }
      const event = await sendCommand(commands.getPublicKeyDataCommand, data)
      return event.data.result
    },
    async getPrivateKeyData(keyID: string, password: string) {
      const data = { keyID, password }
      const event = await sendCommand(commands.getPrivateKeyDataCommand, data)
      return event.data.result
    },
    async saveKey(keyID: string, password: string, privateData: PrivateKeyData, publicData?: PublicKeyData) {
      const data = { keyID, password, privateData, publicData }
      const event = await sendCommand(commands.saveKeyCommand, data)
      return event.data
    },
    async savePublicKeyData(keyID: string, publicData: PublicKeyData) {
      const data = { keyID, publicData }
      const event = await sendCommand(commands.savePublicKeyDataCommand, data)
      return event.data
    },
    async signTransaction(transaction: Transaction, walletAccount: Account, password: string) {
      const transactionEnvelope = transaction.toEnvelope().toXDR("base64")
      const data = { transactionEnvelope, walletAccount, password }
      const event = await sendCommand(commands.signTransactionCommand, data)

      return new Transaction(event.data.result)
    },
    async removeKey(keyID: string) {
      const data = { keyID }
      const event = await sendCommand(commands.removeKeyCommand, data)
      return event.data
    }
  }
}
