import { SettingsData } from "../types"
import { sendCommand } from "./message-handler"

export async function loadSettings(): Promise<Partial<SettingsData>> {
  const event = await sendCommand("storage:settings:read")
  return event.data.settings
}

export async function saveSettings(updatedSettings: Partial<SettingsData>) {
  const event = await sendCommand("storage:settings:store", { settings: updatedSettings })
  return event.data
}

export async function loadIgnoredSignatureRequestHashes(): Promise<string[]> {
  const event = await sendCommand("storage:ignoredSignatureRequests:read")
  return event.data.ignoredSignatureRequests
}

export async function saveIgnoredSignatureRequestHashes(updatedHashes: string[]) {
  const event = await sendCommand("storage:ignoredSignatureRequests:store", { ignoredSignatureRequests: updatedHashes })
  return event.data
}
