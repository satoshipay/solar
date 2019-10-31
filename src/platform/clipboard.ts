import { call } from "./ipc"

export function copyToClipboard(text: string) {
  return call(IPC.Messages.CopyToClipboard, text)
}
