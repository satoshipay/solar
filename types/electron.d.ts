interface SettingsData {
  agreedToTermsAt?: string
  multisignature: boolean
  testnet: boolean
}

interface ElectronContext {
  readIgnoredSignatureRequestHashes(): string[]
  readKeys(): any
  readSettings(): SettingsData
  updateIgnoredSignatureRequestHashes(updatedHashes: string[]): void
  updateKeys(keyData: any): void
  updateSettings(updatedSettings: Partial<SettingsData>): void
}

interface Window {
  // Will only be defined when in an electron build
  electron?: ElectronContext
}
