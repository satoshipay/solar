import { Transaction } from "stellar-sdk"
import { Account } from "../context/accounts"

export interface SettingsData {
  agreedToTermsAt?: string
  biometricLock: boolean
  multisignature: boolean
  testnet: boolean
  hideMemos: boolean
}

export interface KeyStoreAPI {
  getKeyIDs(): Promise<string[]>
  getPublicKeyData(keyID: string): Promise<PublicKeyData>
  getPrivateKeyData(keyID: string, password: string): Promise<PrivateKeyData>
  saveKey(keyID: string, password: string, privateData: PrivateKeyData, publicData?: PublicKeyData): Promise<void>
  savePublicKeyData(keyID: string, publicData: PublicKeyData): Promise<void>
  signTransaction(transaction: Transaction, walletAccount: Account, password: string): Promise<Transaction>
  removeKey(keyID: string): Promise<void>
}
