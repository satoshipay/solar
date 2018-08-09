import { observable, IObservableArray } from "mobx"
import { createStore, KeysData } from "key-store"
import { Keypair } from "stellar-sdk"
import { createWrongPasswordError } from "../lib/errors"
import getKeyStore from "../platform/key-store"

export interface Account {
  id: string
  name: string
  publicKey: string
  requiresPassword: boolean
  testnet: boolean
  getPrivateKey(password: string | null): Promise<string>
}

const AccountStore: Account[] & IObservableArray<Account> = observable([])
const keyStore = getKeyStore()

function createAccountInstance(keyID: string): Account {
  const publicData = keyStore.getPublicKeyData(keyID)
  return {
    id: keyID,
    name: publicData.name,
    publicKey: publicData.publicKey,
    requiresPassword: publicData.password,
    testnet: publicData.testnet,

    async getPrivateKey(password: string | null) {
      const requiresPassword = publicData.password

      if (password === null && requiresPassword) {
        throw new Error(`Account ${keyID} is password-protected, but no password was passed.`)
      }
      try {
        const privateData = await keyStore.getPrivateKeyData(keyID, password || "")
        return privateData.privateKey
      } catch (error) {
        // tslint:disable-next-line:no-console
        console.debug("Decrypting private key data failed. Assuming wrong password:", error)
        throw createWrongPasswordError()
      }
    }
  }
}

for (const keyID of keyStore.getKeyIDs()) {
  AccountStore.push(createAccountInstance(keyID))
}

export default AccountStore

export async function createAccount(accountData: {
  id?: string
  name: string
  keypair: Keypair
  password: string | null
  testnet: boolean
}) {
  const createID = () => {
    const highestID = AccountStore.reduce(
      (highestIdSoFar, someAccount) =>
        parseInt(someAccount.id, 10) > highestIdSoFar ? parseInt(someAccount.id, 10) : highestIdSoFar,
      0
    )
    return String(highestID + 1)
  }

  const id = accountData.id || createID()

  await keyStore.saveKey(
    id,
    accountData.password || "",
    { privateKey: accountData.keypair.secret() },
    {
      name: accountData.name,
      password: accountData.password !== null,
      publicKey: accountData.keypair.publicKey(),
      testnet: accountData.testnet
    }
  )

  const account = createAccountInstance(id)
  AccountStore.push(account)

  return account
}

function updateAccountInStore(updatedAccount: Account) {
  const index = AccountStore.findIndex(account => account.id === updatedAccount.id)
  AccountStore.splice(index, 1, updatedAccount)
}

export async function renameAccount(accountID: string, newName: string) {
  await keyStore.savePublicKeyData(accountID, {
    ...keyStore.getPublicKeyData(accountID),
    name: newName
  })

  updateAccountInStore(createAccountInstance(accountID))
}

export async function deleteAccount(accountID: string) {
  await keyStore.removeKey(accountID)

  const index = AccountStore.findIndex(account => account.id === accountID)
  AccountStore.splice(index, 1)
}

export async function changePassword(accountID: string, prevPassword: string, nextPassword: string) {
  const privateKeyData = keyStore.getPrivateKeyData(accountID, prevPassword)
  const publicKeyData = keyStore.getPublicKeyData(accountID)

  // Setting `password: true` explicitly, in case there was no password set before
  await keyStore.saveKey(accountID, nextPassword, privateKeyData, { ...publicKeyData, password: true })

  updateAccountInStore(createAccountInstance(accountID))
}

export async function removePassword(accountID: string, prevPassword: string) {
  const privateKeyData = keyStore.getPrivateKeyData(accountID, prevPassword)
  const publicKeyData = keyStore.getPublicKeyData(accountID)

  await keyStore.saveKey(accountID, "", privateKeyData, { ...publicKeyData, password: false })

  updateAccountInStore(createAccountInstance(accountID))
}
