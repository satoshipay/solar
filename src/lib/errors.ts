import { TFunction } from "i18next"
import pick from "lodash.pick"

interface CustomError extends Error {
  __extraProps: string[]
}

export function CustomError(name: string, message: string, extra?: Record<string, string>) {
  return Object.assign(Error(message), {
    ...extra,
    name,
    __extraProps: extra ? Object.keys(extra) : undefined
  })
}

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

function isCustomError(error: any): error is CustomError {
  return error && (error.name !== "Error" || error.__extraProps !== undefined)
}

function toKebabCase(value: string) {
  return value
    .replace(/([A-Z])([A-Z])/g, "$1-$2")
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase()
}

export function getErrorTranslation(error: Error, t: TFunction): string {
  const key = `error.custom.${toKebabCase(error.name)}`
  const params = isCustomError(error) ? pick(error, error.__extraProps || []) : undefined

  const fallback = error.message
  return t([key, fallback], params)
}

export function renderFormFieldError(error: any, t: TFunction) {
  if (error) {
    return error instanceof Error ? getErrorTranslation(error, t) : error.message
  } else {
    return error
  }
}
