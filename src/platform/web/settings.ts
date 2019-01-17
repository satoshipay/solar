import { SettingsData } from "../types"

let settings: SettingsData = {
  agreedToTermsAt: undefined,
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

export function loadIgnoredSignatureRequestHashes() {
  const data = window.localStorage.getItem("wallet:storage:ignoredSignatureRequests")
  return data ? JSON.parse(data) : []
}

export function saveIgnoredSignatureRequestHashes(updatedSignatureRequestHashes: string[]) {
  window.localStorage.setItem("wallet:storage:ignoredSignatureRequests", JSON.stringify(updatedSignatureRequestHashes))
}
