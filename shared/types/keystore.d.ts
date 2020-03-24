declare namespace KeyStoreAppKey {
  export enum AppAuthPolicy {
    AlwaysPassword = "password",
    BiometricAuth = "biometric",
    Unprotected = "none"
  }

  export interface AppKeyData {
    authPolicy: AppAuthPolicy
    nonce: string // base64-encoded
    passwordHash: string // base64-encoded
    version: 1
  }
}

declare namespace KeyStoreAccountV0 {
  export interface PublicKeyData {
    name: string
    password: boolean
    publicKey: string
    testnet: boolean
  }

  export interface PrivateKeyData {
    privateKey: string
  }
}

declare namespace KeyStoreAccountV1 {
  export enum TxAuthPolicy {
    AlwaysPassword = "password",
    BiometricAuth = "biometric",
    Unprotected = "none"
  }

  export interface PublicKeyData extends KeyStoreAccountV0.PublicKeyData {
    txAuth: TxAuthPolicy
    version: 1
  }

  export type PrivateKeyData = KeyStoreAccountV0.PrivateKeyData
}

declare namespace KeyStoreAccount {
  export type TxAuthPolicy = KeyStoreAccountV1.TxAuthPolicy
  export type PublicKeyData = KeyStoreAccountV0.PublicKeyData | KeyStoreAccountV1.PublicKeyData
  export type PrivateKeyData = KeyStoreAccountV0.PrivateKeyData | KeyStoreAccountV1.PrivateKeyData
}
