import { commands } from "../../cordova/ipc"
import { sendCommand } from "./message-handler"

export function testBiometricAuth(message: string) {
  return new Promise<void>(async (resolve, reject) => {
    if (window.confirm(message)) {
      const event = await sendCommand(commands.testBioAuthCommand)
      if (event.data.error) {
        reject(event.data.error)
      } else {
        resolve()
      }
    } else {
      reject("Confirmation dismissed by user.")
    }
  })
}
