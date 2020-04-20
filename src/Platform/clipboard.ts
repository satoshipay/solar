import { Messages } from "../shared/ipc"
import { call } from "./ipc"

export function copyToClipboard(text: string) {
  return call(Messages.CopyToClipboard, text)
}
