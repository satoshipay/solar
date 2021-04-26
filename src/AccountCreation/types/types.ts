export interface AccountCreation {
  cosigner: boolean
  cosignerOf?: string
  import: boolean
  name: string
  password: string
  repeatedPassword: string
  requiresPassword: boolean
  secretKey?: string
  testnet: boolean
}

export interface AccountCreationErrors {
  name?: string
  password?: string
  secretKey?: string
}
