export function createWrongPasswordError(message: string = "Wrong password.") {
  return Object.assign(new Error(message), { name: "WrongPasswordError" })
}

export function isWrongPasswordError(error: any) {
  return error && error.name === "WrongPasswordError"
}
