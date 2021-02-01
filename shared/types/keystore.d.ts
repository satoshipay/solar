declare interface PublicKeyData {
  name: string
  password: boolean
  publicKey: string
  testnet: boolean
}

declare interface PrivateKeyData {
  privateKey: string
}

declare interface KeyMetadata {
  nonce: string
  iterations: number
}

declare interface RawKeyData {
  metadata: KeyMetadata
  public: PublicKeyData
  private: string
}
