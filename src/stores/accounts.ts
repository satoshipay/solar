import { observable, IObservableArray } from 'mobx'
import { Keypair } from 'stellar-sdk'

export interface Account {
  id: string,
  name: string,
  testnet: boolean,
  publicKey: string,
  getPrivateKey (password: string | null): Promise<string>
}

const AccountStore: Account[] & IObservableArray<Account> = observable([
  // Mock data:
  {
    id: '1',
    name: 'Test account',
    publicKey: 'GBPBFWVBADSESGADWEGC7SGTHE3535FWK4BS6UW3WMHX26PHGIH5NF4W',
    testnet: true,
    async getPrivateKey () {
      return 'SCVD32GWIQAVBZZDH4F4ROF2TJMTTAEI762DFMEU64BMOHWXFMI3S5CD'
    }
  }
])

export default AccountStore

export function createAccount (accountData: { id?: string, name: string, keypair: Keypair, testnet: boolean }) {
  const createID = () => {
    const highestID = AccountStore.reduce(
      (id, someAccount) => parseInt(someAccount.id, 10) > id ? parseInt(someAccount.id, 10) : id,
      0
    )
    return String(highestID + 1)
  }

  const account: Account = {
    id: accountData.id || createID(),
    name: accountData.name,
    publicKey: accountData.keypair.publicKey(),
    testnet: accountData.testnet,
    getPrivateKey: async () => accountData.keypair.secret()
  }
  AccountStore.push(account)
  return account
}

export function renameAccount (accountID: string, newName: string) {
  const accountIndex = AccountStore.findIndex(account => account.id === accountID)
  const prevAccount = AccountStore[accountIndex]

  AccountStore.splice(accountIndex, 1, {
    ...prevAccount,
    name: newName
  })
}

export function deleteAccount (accountID: string) {
  const accountIndex = AccountStore.findIndex(account => account.id === accountID)
  AccountStore.splice(accountIndex, 1)
}
