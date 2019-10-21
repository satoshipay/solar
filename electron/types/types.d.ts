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
  signTransaction(txEnvelopeXdr: string, keyID: string, networkPassphrase: string, password: string): Promise<string>
  removeKey(keyID: string): Promise<void>

  readIgnoredSignatureRequestHashes(): string[]
  readSettings(): SettingsData
  updateIgnoredSignatureRequestHashes(updatedHashes: string[]): void
  updateSettings(updatedSettings: Partial<SettingsData>): void
  subscribeToIPCMain(channel: string, subscribeCallback: (event: Event, ...args: any[]) => void): () => void
}

interface Window {
  // Will only be defined when in an electron build
  electron?: ElectronContext
}

declare module NodeJS {
  interface Global {
    // Will only be defined when in an electron build
    electron?: ElectronContext
    process: NodeJS.Process
  }
}

declare module "electron-reload" {
  export default function autoReload(
    paths: string,
    options?: { electron?: string; argv?: string[]; hardResetMethod?: "exit"; forceHardReset?: boolean }
  ): void
}
