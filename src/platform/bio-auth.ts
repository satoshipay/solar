import { call } from "./ipc"

export function isBiometricAuthAvailable() {
  return call(IPC.Messages.BioAuthAvailable)
}

export function testBiometricAuth(message: string) {
  return new Promise<void>(async (resolve, reject) => {
    if (window.confirm(message)) {
      const error = await call(IPC.Messages.TestBioAuth)
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
