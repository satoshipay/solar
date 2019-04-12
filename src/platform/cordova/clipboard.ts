import { sendCommand } from "./message-handler"
import { commands } from "../../cordova/ipc"

export async function copyToClipboard(text: string): Promise<any> {
  // Do not return the sendCommand() promise, since it will never resolve
  // (It does not send a response event)
  sendCommand(commands.copyToClipboard, { text })
}
