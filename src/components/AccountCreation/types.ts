export interface AccountCreation {
  import: boolean
  multisig: boolean
  name: string
  password: string
  repeatedPassword: string
  requiresPassword: boolean
  secretKey?: string
  testnet: boolean
}

export interface AccountCreationErrors {
  password?: string
  secretKey?: string
}
