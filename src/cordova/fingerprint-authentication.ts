export async function isAuthenticationAvailable() {
  return new Promise((resolve, reject) => {
    Fingerprint.isAvailable(resolve, reject)
  })
}

export async function showAuthenticationDialogue(clientSecret: string) {
  return new Promise((resolve, reject) => {
    Fingerprint.show(
      {
        clientId: "Solar",
        clientSecret
      },
      resolve,
      reject
    )
  })
}
