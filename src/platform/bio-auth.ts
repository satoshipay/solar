import { Messages } from "../shared/ipc"
import { call } from "./ipc"

export function isBiometricAuthAvailable() {
  return call(Messages.BioAuthAvailable)
}

export function testBiometricAuth(message: string) {
  return new Promise<void>(async (resolve, reject) => {
    if (window.confirm(message)) {
      const error = await call(Messages.TestBioAuth)
      if (error) {
        reject(error)
      } else {
        resolve()
      }
    } else {
      reject("Confirmation dismissed by user.")
    }
  })
}
