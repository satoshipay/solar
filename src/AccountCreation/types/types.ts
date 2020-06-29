export interface AccountCreation {
  import: boolean
  importHardware: boolean
  multisig: boolean
  name: string
  password: string
  repeatedPassword: string
  requiresPassword: boolean
  secretKey?: string
  testnet: boolean
  walletID?: string
}

export interface AccountCreationErrors {
  password?: string
  secretKey?: string
  walletID?: string
}
