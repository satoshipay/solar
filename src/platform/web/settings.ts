import { SettingsData } from "../types"

export const biometricLockAvailable = false

let settings: SettingsData = {
  agreedToTermsAt: "2019-01-17T07:34:05.688Z",
  biometricLock: false,
  multisignature: true,
  testnet: true
}

export async function loadSettings() {
  return settings
}

export function saveSettings(updatedSettings: Partial<SettingsData>) {
  settings = {
    ...settings,
    ...updatedSettings
  }
}

export async function loadIgnoredSignatureRequestHashes() {
  const data = window.localStorage.getItem("wallet:storage:ignoredSignatureRequests")
  return data ? JSON.parse(data) : []
}

export function saveIgnoredSignatureRequestHashes(updatedSignatureRequestHashes: string[]) {
  window.localStorage.setItem("wallet:storage:ignoredSignatureRequests", JSON.stringify(updatedSignatureRequestHashes))
}
