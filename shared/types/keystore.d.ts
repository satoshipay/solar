declare interface PublicKeyData {
  cosignerOf?: string
  name: string
  password: boolean
  publicKey: string
  testnet: boolean
}

declare interface PrivateKeyData {
  privateKey: string
}
