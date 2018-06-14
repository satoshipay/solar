import { observable, IObservableArray } from 'mobx'

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
    testnet: true,
    publicKey: 'GBPBFWVBADSESGADWEGC7SGTHE3535FWK4BS6UW3WMHX26PHGIH5NF4W',
    async getPrivateKey () {
      return 'SCVD32GWIQAVBZZDH4F4ROF2TJMTTAEI762DFMEU64BMOHWXFMI3S5CD'
    }
  }
])

export default WalletStore
