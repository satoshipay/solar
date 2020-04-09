import { app } from "electron"
import isDev from "electron-is-dev"
import Store from "electron-store"
import { createStore } from "key-store"
import generateID from "nanoid/generate"
import * as path from "path"
import { Keypair, Networks, Transaction } from "stellar-sdk"
import { Messages } from "../shared/ipc"
import { hasLedgerHardwareWallet, signTransactionWithLedger, getLedgerPublicKey } from "../ledger"
import { expose } from "./_ipc"

// Use legacy path to not break backwards-compatibility
const storeDirectoryPath = path.join(app.getPath("appData"), "satoshipay-stellar-wallet")

// Use different key stores for development and production
const mainStore = new Store({
  cwd: storeDirectoryPath,
  name: isDev ? "development" : "config"
})

const readKeys = () => {
  return mainStore.has("keys") ? mainStore.get("keys") : {}
}

const updateKeys = (arg: any) => {
  mainStore.set("keys", arg)
}

const keystore = createStore<PrivateKeyData, PublicKeyData>(updateKeys, readKeys())

export function readInstallationID() {
  if (!mainStore.has("installation-id")) {
    mainStore.set("installation-id", generateID("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789", 8))
  }
  return mainStore.get("installation-id")
}

/////////////
// Keystore:

expose(Messages.GetKeyIDs, function getKeyIDs() {
  return keystore.getKeyIDs()
})

expose(Messages.GetPublicKeyData, function getPublicKeyData(keyID) {
  return keystore.getPublicKeyData(keyID)
})

expose(Messages.GetPrivateKeyData, function getPrivateKeyData(keyID, password) {
  return keystore.getPrivateKeyData(keyID, password)
})

expose(Messages.SaveKey, function saveKey(keyID, password, privateData, publicData?) {
  return keystore.saveKey(keyID, password, privateData, publicData)
})

expose(Messages.SavePublicKeyData, function saveKey(keyID, publicData) {
  return keystore.savePublicKeyData(keyID, publicData)
})

expose(Messages.RemoveKey, function removeKey(keyID) {
  return keystore.removeKey(keyID)
})

expose(Messages.SignTransaction, function signTransaction(internalAccountID, transactionXDR, password) {
  try {
    const account = keystore.getPublicKeyData(internalAccountID)
    const networkPassphrase = account.testnet ? Networks.TESTNET : Networks.PUBLIC
    const transaction = new Transaction(transactionXDR, networkPassphrase)

    const privateKey = keystore.getPrivateKeyData(internalAccountID, password).privateKey
    transaction.sign(Keypair.fromSecret(privateKey))

    return transaction
      .toEnvelope()
      .toXDR()
      .toString("base64")
  } catch (error) {
    throw Object.assign(new Error("Wrong password."), { name: "WrongPasswordError" })
  }
})

expose(Messages.SignTransactionWithHardwareWallet, async function signTransaction(accountIndex, transactionXDR) {
  try {
    const networkPassphrase = Networks.PUBLIC
    const transaction = new Transaction(transactionXDR, networkPassphrase)

    if (await hasLedgerHardwareWallet()) {
      await signTransactionWithLedger(accountIndex, transaction)
    } else {
      throw Error("Could not find a supported hardware wallet")
    }

    return transaction
      .toEnvelope()
      .toXDR()
      .toString("base64")
  } catch (error) {
    throw Object.assign(new Error(`Could not sign transaction with hardware wallet: ${error.message}`), {
      name: "SignWithHardwareWalletError",
      message: error.message
    })
  }
})

/////////////
// Settings:

expose(Messages.ReadSettings, function readSettings() {
  return mainStore.has("settings") ? mainStore.get("settings") : {}
})

expose(Messages.StoreSettings, function storeSettings(updatedSettings: Partial<Platform.SettingsData>) {
  const prevSettings = mainStore.has("settings") ? mainStore.get("settings") : {}
  mainStore.set("settings", { ...prevSettings, ...updatedSettings })
  return true
})

//////////////////
// Dismissed txs:

expose(Messages.ReadIgnoredSignatureRequestHashes, function readIgnoredSignatureRequestHashes() {
  return mainStore.has("ignoredSignatureRequests") ? mainStore.get("ignoredSignatureRequests") : []
})

expose(Messages.StoreIgnoredSignatureRequestHashes, function storeIgnoredSignatureRequestHashes(
  updatedHashes: string[]
) {
  mainStore.set("ignoredSignatureRequests", updatedHashes)
  return true
})

////////////////////
// Hardware wallets:

expose(Messages.GetHardwareWalletAccounts, async function getHardwareWallets() {
  const hardwareWallets: HardwareWalletAccount[] = []

  if (await hasLedgerHardwareWallet()) {
    const ledgerWallets = (await Promise.all(
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(async accountIndex =>
        getLedgerPublicKey(accountIndex)
          .then(publicKey => ({
            accountIndex,
            name: `Ledger Wallet #${accountIndex + 1}`,
            publicKey
          }))
          .catch(() => undefined)
      )
    ).then(values => values.filter(value => value))) as HardwareWalletAccount[]

    hardwareWallets.push(...ledgerWallets)
  }

  return hardwareWallets
})
