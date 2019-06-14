import { sendCommand } from "./message-handler"
import { commands } from "../../cordova/ipc"

export function openLink(href: string) {
  // Do not return the sendCommand() promise, since it will never resolve
  // (It does not send a response event)
  sendCommand(commands.openLink, { url: href })
}
