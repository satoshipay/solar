import { Messages } from "../Shared/ipc"
import { call } from "./ipc"

interface Updater {
  isUpdateAvailable(): Promise<boolean>
  isUpdateStarted(): boolean
  isUpdateDownloaded(): boolean
  startUpdate(): Promise<void>
}

let updateStarted = false
let updateDownloaded = false

const updater: Updater = {
  isUpdateAvailable: () => call(Messages.CheckUpdateAvailability),
  isUpdateStarted: () => updateStarted,
  isUpdateDownloaded: () => updateDownloaded,
  startUpdate: async () => {
    updateStarted = true
    const result = await call(Messages.StartUpdate)
    updateStarted = false
    updateDownloaded = true
    return result
  }
}

export default function getUpdater(): Updater {
  return updater
}
