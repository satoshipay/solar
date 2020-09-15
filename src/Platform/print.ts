import { Messages } from "~shared/ipc"
import { call } from "./ipc"

export async function print() {
  return call(Messages.Print)
}
