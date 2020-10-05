export interface AccountCreation {
  import: boolean
  mnemonic?: string
  multisig: boolean
  name: string
  password: string
  repeatedPassword: string
  requiresPassword: boolean
  secretKey?: string
  testnet: boolean
  useMnemonic: boolean
}

export interface AccountCreationErrors {
  password?: string
  secretKey?: string
}
