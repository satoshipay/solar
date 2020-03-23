import { Messages } from "../Shared/ipc"
import { call } from "./ipc"

export function copyToClipboard(text: string) {
  return call(Messages.CopyToClipboard, text)
}
