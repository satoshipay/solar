import { Messages } from "../shared/ipc"
import { call } from "./ipc"

interface Updater {
  isUpdateAvailable(): Promise<boolean>
  isUpdateStarted(): boolean
  startUpdate(): Promise<void>
}

let updateStarted = false

const updater: Updater = {
  isUpdateAvailable: () => call(Messages.CheckUpdateAvailability),
  isUpdateStarted: () => updateStarted,
  startUpdate: async () => {
    updateStarted = true
    const result = await call(Messages.StartUpdate)
    updateStarted = false
    return result
  }
}

export default function getUpdater(): Updater {
  return updater
}
