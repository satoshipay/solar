import { ipcRenderer } from "electron"
import { SettingsData } from "../types"

export function loadSettings() {
  return ipcRenderer.sendSync("storage:settings:readSync")
}

export function saveSettings(updatedSettings: Partial<SettingsData>) {
  ipcRenderer.sendSync("storage:settings:storeSync", updatedSettings)
}

export function loadIgnoredSignatureRequestHashes() {
  return ipcRenderer.sendSync("storage:ignoredSignatureRequests:readSync")
}

export function saveIgnoredSignatureRequestHashes(updatedSignatureRequestHashes: string[]) {
  ipcRenderer.sendSync("storage:ignoredSignatureRequests:storeSync", updatedSignatureRequestHashes)
}
