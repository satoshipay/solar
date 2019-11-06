import { Messages } from "../../shared/ipc"
import { expose } from "./ipc"

export function registerUpdateHandler() {
  expose(Messages.CheckUpdateAvailability, () => false)
  expose(Messages.StartUpdate, () => undefined)
}
