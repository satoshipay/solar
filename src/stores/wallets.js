import { observable } from 'mobx'

const WalletStore = observable([
  // Mock data:
  {
    id: '1',
    name: 'Test wallet',
    testnet: true,
    privateKey: 'SCVD32GWIQAVBZZDH4F4ROF2TJMTTAEI762DFMEU64BMOHWXFMI3S5CD'
  }
])

export default WalletStore
