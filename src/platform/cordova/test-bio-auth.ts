import { commands } from "../../cordova/ipc"
import { sendCommand } from "./message-handler"

function testBiometricAuth() {
  return new Promise<void>(async (resolve, reject) => {
    if (showConfirmationPrompt()) {
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

function showConfirmationPrompt() {
  return window.confirm("Unlock your device once to enable the feature.")
}

export default testBiometricAuth
