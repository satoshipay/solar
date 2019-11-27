export async function isBiometricAuthAvailable() {
  return new Promise<boolean>(resolve => {
    Fingerprint.isAvailable(() => resolve(true), () => resolve(false))
  })
}

export async function bioAuthenticate() {
  return new Promise((resolve, reject) => {
    Fingerprint.show(
      {
        title: "Unlock Solar",
        description: device && device.platform === "iOS" ? "Unlock your Solar wallet" : undefined
      },
      resolve,
      reject
    )
  })
}
