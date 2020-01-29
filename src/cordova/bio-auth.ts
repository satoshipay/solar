export async function isBiometricAuthAvailable() {
  return new Promise<BiometricAvailabilityResult>(resolve => {
    Fingerprint.isAvailable(
      result => {
        resolve({ available: true, message: result })
      },
      error => {
        resolve({ available: false, message: error.message, code: error.code })
      }
    )
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
