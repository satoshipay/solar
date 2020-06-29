declare interface PublicKeyData {
  name: string
  password: boolean
  publicKey: string
  testnet: boolean
}

declare interface PrivateKeyData {
  privateKey: string
}

declare interface HardwareWallet {
  id: string
  deviceModel?: string
}

declare interface HardwareWalletAccount {
  accountIndex: number
  name: string
  publicKey: string
  walletID: string
}
