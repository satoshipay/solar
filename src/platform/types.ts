export interface PublicKeyData {
  name: string
  password: boolean
  publicKey: string
  testnet: boolean
}

export interface PrivateKeyData {
  privateKey: string
}

export interface SettingsData {
  agreedToToC: boolean
  multisignature: boolean
  testnet: boolean
}
