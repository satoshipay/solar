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
  agreedToTermsAt?: string
  biometricLock: boolean
  multisignature: boolean
  testnet: boolean
  hideMemos: boolean
}
