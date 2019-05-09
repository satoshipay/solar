import { SettingsData } from "../types"
import { sendCommand } from "./message-handler"
import { commands } from "../../cordova/ipc"

export const biometricLockAvailable = true

export async function loadSettings(): Promise<Partial<SettingsData>> {
  const event = await sendCommand(commands.readSettingsCommand)
  return event.data.settings
}

export async function saveSettings(updatedSettings: Partial<SettingsData>) {
  const event = await sendCommand(commands.storeSettingsCommand, { settings: updatedSettings })
  return event.data
}

export async function loadIgnoredSignatureRequestHashes(): Promise<string[]> {
  const event = await sendCommand(commands.readIgnoredSignatureRequestsCommand)
  const { ignoredSignatureRequests } = event.data

  if (!Array.isArray(ignoredSignatureRequests)) {
    throw new Error("Expected ignoredSignatureRequests to be an array.")
  }
  return ignoredSignatureRequests
}

export async function saveIgnoredSignatureRequestHashes(updatedHashes: string[]) {
  const event = await sendCommand(commands.storeIgnoredSignatureRequestsCommand, {
    ignoredSignatureRequests: updatedHashes
  })
  return event.data
}
