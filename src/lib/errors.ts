export function createWrongPasswordError(message: string = "Wrong password.") {
  return Object.assign(new Error(message), { name: "WrongPasswordError" })
}

export function isWrongPasswordError(error: any) {
  return error && error.name === "WrongPasswordError"
}

export function renderFormFieldError(error: any) {
  if (error) {
    return error instanceof Error ? error.message : error
  } else {
    return error
  }
}
