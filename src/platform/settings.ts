import { SettingsData } from "./types"

export { SettingsData }

interface SettingsStore {
  loadIgnoredSignatureRequestHashes(): string[]
  loadSettings(): Partial<SettingsData>
  saveIgnoredSignatureRequestHashes(updatedSignatureRequestHashes: string[]): void
  saveSettings(settingsUpdate: Partial<SettingsData>): void
}

const implementation = getImplementation()

function getImplementation(): SettingsStore {
  if (window.electron) {
    return require("./electron/settings")
  } else if (process.browser) {
    return require("./web/settings")
  } else {
    throw new Error("There is no implementation for your platform.")
  }
}

export const loadIgnoredSignatureRequestHashes = implementation.loadIgnoredSignatureRequestHashes
export const saveIgnoredSignatureRequestHashes = implementation.saveIgnoredSignatureRequestHashes

export const loadSettings = implementation.loadSettings
export const saveSettings = implementation.saveSettings
