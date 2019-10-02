import { Transaction, Networks } from "stellar-sdk"
import { commands } from "../../cordova/ipc"
import { Account } from "../../context/accounts"
import { networkPassphrases } from "../../lib/stellar"
import { KeyStoreAPI } from "../types"
import { sendCommand } from "./message-handler"
import { WrongPasswordError } from "../../lib/errors"

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
    async signTransaction(transaction: Transaction, account: Account, password: string) {
      const transactionEnvelope = transaction.toEnvelope().toXDR("base64")
      const event = await sendCommand(commands.keyStore.signTransactionCommand, {
        keyID: account.id,
        networkPassphrase: account.testnet ? networkPassphrases.testnet : networkPassphrases.mainnet,
        password,
        transactionEnvelope
      })
      if (event.data.error === "Wrong password") {
        throw WrongPasswordError()
      } else {
        const signedTransactionEnvelope = event.data.result
        const networkPassphrase = account.testnet ? Networks.TESTNET : Networks.PUBLIC
        return new Transaction(signedTransactionEnvelope, networkPassphrase)
      }
    },
    async removeKey(keyID: string) {
      const data = { keyID }
      await sendCommand(commands.keyStore.removeKeyCommand, data)
    }
  }
}
