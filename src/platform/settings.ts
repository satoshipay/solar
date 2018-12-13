import { SettingsData } from "./types"

export { SettingsData }

interface SettingsStore {
  loadSettings(): Partial<SettingsData>
  saveSettings(settingsUpdate: Partial<SettingsData>): void
}

const runningInElectron = () => Boolean(process.pid)
const implementation = getImplementation()

function getImplementation(): SettingsStore {
  if (runningInElectron()) {
    return require("./electron/settings")
  } else if (process.browser) {
    return require("./web/settings")
  } else {
    throw new Error("There is no implementation for your platform.")
  }
}

export const loadSettings = implementation.loadSettings
export const saveSettings = implementation.saveSettings
