import { TFunction } from "i18next"
import React from "react"
import { useTranslation } from "react-i18next"
import { Keypair, Transaction } from "stellar-sdk"
import { WrongPasswordError } from "../lib/errors"
import getKeyStore, { KeyStoreAPI } from "../platform/key-store"
import { trackError } from "./notifications"

export interface Account {
  id: string
  name: string
  publicKey: string
  requiresPassword: boolean
  testnet: boolean
  getPrivateKey(password: string | null): Promise<string>
  signTransaction(transaction: Transaction, password: string | null): Promise<Transaction>
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
async function createAccountInstance(keyStore: KeyStoreAPI, keyID: string, t: TFunction) {
  const publicData = await keyStore.getPublicKeyData(keyID)
  const account: Account = {
    id: keyID,
    name: publicData.name,
    publicKey: publicData.publicKey,
    requiresPassword: publicData.password,
    testnet: publicData.testnet,

    async getPrivateKey(password: string | null) {
      const requiresPassword = publicData.password

      if (password === null && requiresPassword) {
        throw new Error(t("error.accounts.password-required", { accountName: publicData.name }))
      }
      try {
        const privateData = await keyStore.getPrivateKeyData(keyID, password || "")
        return privateData.privateKey
      } catch (error) {
        // tslint:disable-next-line:no-console
        console.debug("Decrypting private key data failed. Assuming wrong password:", error)
        throw WrongPasswordError()
      }
    },

    async signTransaction(transaction: Transaction, password: string | null) {
      const requiresPassword = publicData.password

      if (password === null && requiresPassword) {
        throw new Error(t("error.accounts.password-required", { accountName: publicData.name }))
      }

      return keyStore.signTransaction(account.id, transaction, password || "")
    }
  }
  return account
}

async function createAccountInKeyStore(accounts: Account[], accountData: NewAccountData, t: TFunction) {
  if (accounts.some(someAccount => someAccount.name.toLowerCase() === accountData.name.toLowerCase())) {
    throw new Error(t("error.accounts.existing-account"))
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
  return createAccountInstance(keyStore, id, t)
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
  const { t } = useTranslation()

  React.useEffect(() => {
    const keyStore = getKeyStore()

    try {
      keyStore
        .getKeyIDs()
        .then(async keyIDs => {
          const loadedAccounts = await Promise.all(keyIDs.map(keyID => createAccountInstance(keyStore, keyID, t)))
          setAccounts(loadedAccounts)
          setNetworkSwitch(getInitialNetwork(loadedAccounts))
        })
        .catch(trackError)
    } catch (error) {
      trackError(error)
    }

    const unsubscribe = () => undefined
    return unsubscribe
  }, [])

  const createAccount = async (accountData: NewAccountData) => {
    const account = await createAccountInKeyStore(accounts, accountData, t)
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
      ...(await keyStore.getPublicKeyData(accountID)),
      name: newName
    })
    updateAccountInStore(await createAccountInstance(keyStore, accountID, t))
  }

  const deleteAccount = async (accountID: string) => {
    const keyStore = await getKeyStore()
    await keyStore.removeKey(accountID)
    setAccounts(prevAccounts => prevAccounts.filter(account => account.id !== accountID))
  }

  const changePassword = async (accountID: string, prevPassword: string, nextPassword: string) => {
    const keyStore = await getKeyStore()

    let privateKeyData: PrivateKeyData
    const publicKeyData = await keyStore.getPublicKeyData(accountID)

    try {
      privateKeyData = await keyStore.getPrivateKeyData(accountID, prevPassword)
    } catch (error) {
      // tslint:disable-next-line:no-console
      console.debug("Decrypting private key data failed. Assuming wrong password:", error)
      throw WrongPasswordError()
    }

    // Setting `password: true` explicitly, in case there was no password set before
    await keyStore.saveKey(accountID, nextPassword, privateKeyData, { ...publicKeyData, password: true })

    updateAccountInStore(await createAccountInstance(keyStore, accountID, t))
  }

  const removePassword = async (accountID: string, prevPassword: string) => {
    const keyStore = await getKeyStore()

    let privateKeyData: PrivateKeyData
    const publicKeyData = await keyStore.getPublicKeyData(accountID)

    try {
      privateKeyData = await keyStore.getPrivateKeyData(accountID, prevPassword)
    } catch (error) {
      // tslint:disable-next-line:no-console
      console.debug("Decrypting private key data failed. Assuming wrong password:", error)
      throw WrongPasswordError()
    }

    await keyStore.saveKey(accountID, "", privateKeyData, { ...publicKeyData, password: false })
    updateAccountInStore(await createAccountInstance(keyStore, accountID, t))
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
