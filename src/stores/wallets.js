import { observable } from 'mobx'

const WalletStore = observable([
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
