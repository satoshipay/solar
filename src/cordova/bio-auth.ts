export async function isBiometricAuthAvailable() {
  return new Promise<boolean>(resolve => {
    Fingerprint.isAvailable(() => resolve(true), () => resolve(false))
  })
}

export async function bioAuthenticate(clientSecret: string) {
  return new Promise((resolve, reject) => {
    Fingerprint.show(
      {
        clientId: "Solar",
        clientSecret,
        localizedFallbackTitle: "Enter Passcode",
        localizedReason: "Unlock your Solar wallet"
      },
      resolve,
      reject
    )
  })
}
