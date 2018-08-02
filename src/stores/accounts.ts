import { observable, IObservableArray } from "mobx"
import { createStore, KeysData } from "key-store"
import { Keypair } from "stellar-sdk"
import { createWrongPasswordError } from "../lib/errors"

export interface Account {
  id: string
  name: string
  publicKey: string
  requiresPassword: boolean
  testnet: boolean
  getPrivateKey(password: string | null): Promise<string>
}

interface PublicKeyData {
  name: string
  password: boolean
  publicKey: string
  testnet: boolean
}

interface PrivateKeyData {
  privateKey: string
}

const initialKeys: KeysData<PublicKeyData> = {
  "1": {
    metadata: {
      nonce: "19sHNxecdiik6chwGFgZVk9UJoG2k8B+",
      iterations: 10000
    },
    public: {
      name: "Test account",
      password: false,
      publicKey: "GBPBFWVBADSESGADWEGC7SGTHE3535FWK4BS6UW3WMHX26PHGIH5NF4W",
      testnet: true
    },
    private:
      "F6SxXmjdLgxPI3msiNWZ7RGHoBwYEdFICLHJqzIZOADn71lfBYFD/qvQxcD9L1Wq495cDek0RlNLGF2fNK8P48A+B7Hfk8hWL+o5EbPd1ql20r7SfxVh9o0="
  },
  "2": {
    metadata: {
      nonce: "PvRwEZlBBIdwo3BPrPCxMpjsxmDbQI1r",
      iterations: 10000
    },
    public: {
      name: "Test account with password",
      password: true,
      publicKey: "GBPBFWVBADSESGADWEGC7SGTHE3535FWK4BS6UW3WMHX26PHGIH5NF4W",
      testnet: true
    },
    private:
      "5VzbN/Y5S1CfizJnnIejm8ku4KsG5cPvRht6BoZ8HalOOKdOt66Ra/rjoNlMbh45Et+25iGggzj+IlFvpepmuaEFcdqj5myEJspcy4GGwn+9TtA+KmUDcRI="
  }
}

// TODO: Create a store that is using persistent storage (#23)
const keyStore = createStore<PrivateKeyData, PublicKeyData>(
  () => undefined,
  initialKeys
)

const AccountStore: Account[] & IObservableArray<Account> = observable([])

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
        throw new Error(
          `Account ${keyID} is password-protected, but no password was passed.`
        )
      }
      try {
        const privateData = await keyStore.getPrivateKeyData(
          keyID,
          password || ""
        )
        return privateData.privateKey
      } catch (error) {
        // tslint:disable-next-line:no-console
        console.debug(
          "Decrypting private key data failed. Assuming wrong password:",
          error
        )
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
        parseInt(someAccount.id, 10) > highestIdSoFar
          ? parseInt(someAccount.id, 10)
          : highestIdSoFar,
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

export async function renameAccount(accountID: string, newName: string) {
  await keyStore.savePublicKeyData(accountID, {
    ...keyStore.getPublicKeyData(accountID),
    name: newName
  })

  const index = AccountStore.findIndex(account => account.id === accountID)
  AccountStore.splice(index, 1, createAccountInstance(accountID))
}

export async function deleteAccount(accountID: string) {
  await keyStore.removeKey(accountID)
}
