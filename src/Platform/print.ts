import { Messages } from "~shared/ipc"
import { call } from "./ipc"

export async function print(options?: object, content?: string) {
  return call(Messages.Print, options, content)
}
