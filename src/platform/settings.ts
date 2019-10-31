import { call } from "./ipc"

interface SettingsStore {
  biometricLockAvailable(): Promise<boolean>
  loadIgnoredSignatureRequestHashes(): Promise<string[]>
  loadSettings(): Promise<Partial<Platform.SettingsData>>
  saveIgnoredSignatureRequestHashes(updatedSignatureRequestHashes: string[]): void
  saveSettings(settingsUpdate: Partial<Platform.SettingsData>): void
}

const implementation: SettingsStore = {
  biometricLockAvailable: () => call(IPC.Messages.BioAuthAvailable),
  loadIgnoredSignatureRequestHashes: () => call(IPC.Messages.ReadIgnoredSignatureRequestHashes),
  saveIgnoredSignatureRequestHashes: updatedSignatureRequestHashes =>
    call(IPC.Messages.StoreIgnoredSignatureRequestHashes, updatedSignatureRequestHashes),
  loadSettings: () => call(IPC.Messages.ReadSettings),
  saveSettings: settingsUpdate => call(IPC.Messages.StoreSettings, settingsUpdate)
}

export const biometricLockAvailable = implementation.biometricLockAvailable

export const loadIgnoredSignatureRequestHashes = implementation.loadIgnoredSignatureRequestHashes
export const saveIgnoredSignatureRequestHashes = implementation.saveIgnoredSignatureRequestHashes

export const loadSettings = implementation.loadSettings
export const saveSettings = implementation.saveSettings
