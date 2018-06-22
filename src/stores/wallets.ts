import { observable, IObservableArray } from 'mobx'
import { Keypair } from 'stellar-sdk'

export interface Wallet {
  id: string,
  name: string,
  testnet: boolean,
  publicKey: string,
  getPrivateKey (password: string | null): Promise<string>
}

const WalletStore: Wallet[] & IObservableArray<Wallet> = observable([
  // Mock data:
  {
    id: '1',
    name: 'Test wallet',
    publicKey: 'GBPBFWVBADSESGADWEGC7SGTHE3535FWK4BS6UW3WMHX26PHGIH5NF4W',
    testnet: true,
    async getPrivateKey () {
      return 'SCVD32GWIQAVBZZDH4F4ROF2TJMTTAEI762DFMEU64BMOHWXFMI3S5CD'
    }
  }
])

export default WalletStore

export function createWallet (walletData: { id?: string, name: string, keypair: Keypair, testnet: boolean }) {
  const createID = () => {
    const highestID = WalletStore.reduce(
      (id, someWallet) => parseInt(someWallet.id, 10) > id ? parseInt(someWallet.id, 10) : id,
      0
    )
    return String(highestID + 1)
  }

  const wallet: Wallet = {
    id: walletData.id || createID(),
    name: walletData.name,
    publicKey: walletData.keypair.publicKey(),
    testnet: walletData.testnet,
    getPrivateKey: async () => walletData.keypair.secret()
  }
  WalletStore.push(wallet)
  return wallet
}
