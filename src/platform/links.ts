import { call } from "./ipc"

export function openLink(href: string) {
  return call(IPC.Messages.OpenLink, href)
}
