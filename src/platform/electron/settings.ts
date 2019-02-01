import { SettingsData } from "../types"

export function loadSettings() {
  if (!window.electron) {
    throw new Error("No electron runtime context available.")
  }
  return window.electron.readSettings()
}

export function saveSettings(updatedSettings: Partial<SettingsData>) {
  if (!window.electron) {
    throw new Error("No electron runtime context available.")
  }
  window.electron.updateSettings(updatedSettings)
}

export function loadIgnoredSignatureRequestHashes() {
  if (!window.electron) {
    throw new Error("No electron runtime context available.")
  }
  return window.electron.readIgnoredSignatureRequestHashes()
}

export function saveIgnoredSignatureRequestHashes(updatedHashes: string[]) {
  if (!window.electron) {
    throw new Error("No electron runtime context available.")
  }
  window.electron.updateIgnoredSignatureRequestHashes(updatedHashes)
}
