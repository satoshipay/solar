import { Messages } from "../Shared/ipc"
import { call } from "./ipc"

export function openLink(href: string) {
  return call(Messages.OpenLink, href)
}
