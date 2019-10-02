export interface Cancellation extends Error {
  name: "Cancellation"
}

export function Cancellation(message: string) {
  return Object.assign(Error(message), { name: "Cancellation" }) as Cancellation
}

export function isCancellation(thing: any) {
  return thing instanceof Error && thing.name === "Cancellation"
}

export function WrongPasswordError(message: string = "Wrong password.") {
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
