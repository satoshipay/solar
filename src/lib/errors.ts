import { TFunction } from "i18next"
import pick from "lodash.pick"
import { SerializerImplementation } from "threads"

interface SerializedCustomError {
  __extraProps: string[]
  __type: "$$CustomError"
  extras?: Record<string, string>
  message: string
  name: string
  stack: any
}

type CustomErrorProps = Record<string, string | number | boolean | null>

type CustomError<ExtraProps extends CustomErrorProps = CustomErrorProps> = Error &
  ExtraProps & {
    __extraProps: string[]
  }

export function CustomError(name: string, message: string, extras?: CustomErrorProps): CustomError {
  const error = Object.assign(Error(message), {
    ...extras,
    __extraProps: Object.keys(extras || {}),
    name
  }) as CustomError
  return error
}

CustomError.deserialize = function deserializeCustomError(error: SerializedCustomError): CustomError {
  return Object.assign(CustomError(error.name, error.message, pick(error, error.__extraProps || []) as any), {
    stack: error.stack
  })
}

CustomError.serialize = function serializeCustomError(error: CustomError): SerializedCustomError {
  return {
    ...pick(error, error.__extraProps),
    __extraProps: error.__extraProps,
    __type: "$$CustomError",
    message: error.message,
    name: error.name,
    stack: error.stack
  }
}

CustomError.isCustomError = function isCustomError(thing: any): thing is CustomError {
  return thing && thing instanceof Error && "__extraProps" in thing
}

function isSerializedCustomError(thing: any): thing is SerializedCustomError {
  return thing && typeof thing === "object" && "__type" in thing && thing.__type === "$$CustomError"
}

export const CustomErrorSerializer: SerializerImplementation = {
  deserialize(message, defaultHandler) {
    if (isSerializedCustomError(message)) {
      return CustomError.deserialize(message)
    } else {
      return defaultHandler(message)
    }
  },

  serialize(thing, defaultHandler) {
    if (CustomError.isCustomError(thing)) {
      return CustomError.serialize(thing) as any
    } else {
      return defaultHandler(thing)
    }
  }
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

function toKebabCase(value: string) {
  return value
    .replace(/([A-Z])([A-Z])/g, "$1-$2")
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase()
}

export function getErrorTranslation(error: Error, t: TFunction): string {
  const key = `error.${toKebabCase(error.name)}`
  const params = CustomError.isCustomError(error) ? pick(error, error.__extraProps || []) : undefined

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
