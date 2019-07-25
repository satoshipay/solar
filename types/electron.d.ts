interface SettingsData {
  agreedToTermsAt?: string
  multisignature: boolean
  testnet: boolean
}

interface ElectronContext {
  getKeyIDs(): Promise<string[]>
  getPublicKeyData(keyID: string): Promise<PublicKeyData>
  getPrivateKeyData(keyID: string, password: string): Promise<PrivateKeyData>
  saveKey(keyID: string, password: string, privateData: PrivateKeyData, publicData?: PublicKeyData): Promise<void>
  savePublicKeyData(keyID: string, publicData: PublicKeyData): Promise<void>
  signTransaction(
    transaction: Transaction,
    walletAccount: import("../src/context/accounts").Account,
    password: string
  ): Promise<Transaction>
  removeKey(keyID: string): Promise<void>

  readIgnoredSignatureRequestHashes(): string[]
  readKeys(): any
  readSettings(): SettingsData
  updateIgnoredSignatureRequestHashes(updatedHashes: string[]): void
  updateKeys(keyData: any): void
  updateSettings(updatedSettings: Partial<SettingsData>): void
  subscribeToIPCMain(channel: string, subscribeCallback: (event: Event, ...args: any[]) => void): () => void
}

interface Window {
  // Will only be defined when in an electron build
  electron?: ElectronContext
}
