import { call } from "./ipc"
import { Messages } from "../shared/ipc"

interface SettingsStore {
  biometricAuthAvailable(): Promise<BiometricAvailability>
  loadIgnoredSignatureRequestHashes(): Promise<string[]>
  loadSettings(): Promise<Partial<Platform.SettingsData>>
  saveIgnoredSignatureRequestHashes(updatedSignatureRequestHashes: string[]): void
  saveSettings(settingsUpdate: Partial<Platform.SettingsData>): void
}

const implementation: SettingsStore = {
  biometricAuthAvailable: () => call(Messages.BioAuthAvailable),
  loadIgnoredSignatureRequestHashes: () => call(Messages.ReadIgnoredSignatureRequestHashes),
  saveIgnoredSignatureRequestHashes: updatedSignatureRequestHashes =>
    call(Messages.StoreIgnoredSignatureRequestHashes, updatedSignatureRequestHashes),
  loadSettings: () => call(Messages.ReadSettings),
  saveSettings: settingsUpdate => call(Messages.StoreSettings, settingsUpdate)
}

export const isBiometricAuthAvailable = implementation.biometricAuthAvailable

export const loadIgnoredSignatureRequestHashes = implementation.loadIgnoredSignatureRequestHashes
export const saveIgnoredSignatureRequestHashes = implementation.saveIgnoredSignatureRequestHashes

export const loadSettings = implementation.loadSettings
export const saveSettings = implementation.saveSettings
