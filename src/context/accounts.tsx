import React from "react"
import { Keypair } from "stellar-sdk"
import { createWrongPasswordError } from "../lib/errors"
import getKeyStore from "../platform/key-store"
import { KeyStore } from "key-store"
import { PrivateKeyData, PublicKeyData } from "../platform/types"
import { trackError } from "./notifications"

export interface Account {
  id: string
  name: string
  publicKey: string
  requiresPassword: boolean
  testnet: boolean
  getPrivateKey(password: string | null): Promise<string>
}

export type NetworkID = "mainnet" | "testnet"

interface NewAccountData {
  id?: string
  name: string
  keypair: Keypair
  password: string | null
  testnet: boolean
}

interface ContextValue {
  accounts: Account[]
  networkSwitch: NetworkID
  changePassword(accountID: string, prevPassword: string, nextPassword: string): Promise<any>
  createAccount(accountData: NewAccountData): Promise<Account>
  deleteAccount(accountID: string): Promise<any>
  removePassword(accountID: string, prevPassword: string): Promise<any>
  renameAccount(accountID: string, newName: string): Promise<any>
  toggleNetwork(): void
}

/**
 * Creates a wallet account instance. Not to be confused with the Stellar
 * account response, although they map 1:1.
 */
function createAccountInstance(keyStore: KeyStore<PrivateKeyData, PublicKeyData>, keyID: string): Account {
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

async function createAccountInKeyStore(accounts: Account[], accountData: NewAccountData) {
  if (accounts.some(someAccount => someAccount.name.toLowerCase() === accountData.name.toLowerCase())) {
    throw new Error("An account with that name does already exist.")
  }

  const id = accountData.id || createNextID(accounts)
  const keyStore = await getKeyStore()

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

  // Must happen after updating the key store
  return createAccountInstance(keyStore, id)
}

function createNextID(accounts: Account[]) {
  const highestID = accounts.reduce(
    (highestIdSoFar, someAccount) =>
      parseInt(someAccount.id, 10) > highestIdSoFar ? parseInt(someAccount.id, 10) : highestIdSoFar,
    0
  )
  return String(highestID + 1)
}

function getInitialNetwork(accounts: Account[]) {
  const testnetAccounts = accounts.filter(account => account.testnet)
  return testnetAccounts.length > 0 && testnetAccounts.length === accounts.length ? "testnet" : "mainnet"
}

const initialAccounts: Account[] = []

const AccountsContext = React.createContext<ContextValue>({
  accounts: initialAccounts,
  networkSwitch: "mainnet",
  changePassword: () => Promise.reject(new Error("AccountsProvider not yet ready.")),
  createAccount: () => {
    throw new Error("AccountsProvider not yet ready.")
  },
  deleteAccount: () => Promise.reject(new Error("AccountsProvider not yet ready.")),
  removePassword: () => Promise.reject(new Error("AccountsProvider not yet ready.")),
  renameAccount: () => Promise.reject(new Error("AccountsProvider not yet ready.")),
  toggleNetwork: () => undefined
})

interface Props {
  children: React.ReactNode
}

export function AccountsProvider(props: Props) {
  const [accounts, setAccounts] = React.useState<Account[]>(initialAccounts)
  const [networkSwitch, setNetworkSwitch] = React.useState<NetworkID>("mainnet")

  React.useEffect(() => {
    getKeyStore()
      .then(keyStore => {
        const loadedAccounts = keyStore.getKeyIDs().map(keyID => createAccountInstance(keyStore, keyID))
        setAccounts(loadedAccounts)
        setNetworkSwitch(getInitialNetwork(loadedAccounts))
      })
      .catch(trackError)

    const unsubscribe = () => undefined
    return unsubscribe
  }, [])

  const createAccount = async (accountData: NewAccountData) => {
    const account = await createAccountInKeyStore(accounts, accountData)
    setAccounts(prevAccounts => [...prevAccounts, account])
    return account
  }

  const updateAccountInStore = (updatedAccount: Account) => {
    setAccounts(prevAccounts =>
      prevAccounts.map(account => (account.id === updatedAccount.id ? updatedAccount : account))
    )
  }

  const renameAccount = async (accountID: string, newName: string) => {
    const keyStore = await getKeyStore()
    await keyStore.savePublicKeyData(accountID, {
      ...keyStore.getPublicKeyData(accountID),
      name: newName
    })
    updateAccountInStore(createAccountInstance(keyStore, accountID))
  }

  const deleteAccount = async (accountID: string) => {
    const keyStore = await getKeyStore()
    await keyStore.removeKey(accountID)
    setAccounts(prevAccounts => prevAccounts.filter(account => account.id !== accountID))
  }

  const changePassword = async (accountID: string, prevPassword: string, nextPassword: string) => {
    const keyStore = await getKeyStore()

    const privateKeyData = keyStore.getPrivateKeyData(accountID, prevPassword)
    const publicKeyData = keyStore.getPublicKeyData(accountID)

    // Setting `password: true` explicitly, in case there was no password set before
    await keyStore.saveKey(accountID, nextPassword, privateKeyData, { ...publicKeyData, password: true })

    updateAccountInStore(createAccountInstance(keyStore, accountID))
  }

  const removePassword = async (accountID: string, prevPassword: string) => {
    const keyStore = await getKeyStore()

    const privateKeyData = keyStore.getPrivateKeyData(accountID, prevPassword)
    const publicKeyData = keyStore.getPublicKeyData(accountID)

    await keyStore.saveKey(accountID, "", privateKeyData, { ...publicKeyData, password: false })
    updateAccountInStore(createAccountInstance(keyStore, accountID))
  }

  const toggleNetwork = () => {
    setNetworkSwitch(prevNetwork => (prevNetwork === "mainnet" ? "testnet" : "mainnet"))
  }

  const contextValue: ContextValue = {
    accounts,
    networkSwitch,
    changePassword,
    createAccount,
    deleteAccount,
    removePassword,
    renameAccount,
    toggleNetwork
  }

  return <AccountsContext.Provider value={contextValue}>{props.children}</AccountsContext.Provider>
}

export { AccountsContext, ContextValue as AccountsContextType }
