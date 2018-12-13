import { SettingsData } from "../types"

let settings: SettingsData = {
  multisignature: true,
  testnet: true
}

export function loadSettings() {
  return settings
}

export function saveSettings(updatedSettings: Partial<SettingsData>) {
  settings = {
    ...settings,
    ...updatedSettings
  }
}
