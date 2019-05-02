export async function isBiometricAuthAvailable() {
  return new Promise<boolean>((resolve, reject) => {
    Fingerprint.isAvailable(() => resolve(true), () => resolve(false))
  })
}

export async function bioAuthenticate(clientSecret: string) {
  return new Promise((resolve, reject) => {
    Fingerprint.show(
      {
        clientId: "Solar",
        clientSecret,
        localizedReason: "Unlock the Solar wallet"
      },
      resolve,
      reject
    )
  })
}
