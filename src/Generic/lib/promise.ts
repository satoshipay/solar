import { CustomError } from "./errors"

export const delay = (timeoutMs: number) => new Promise(resolve => setTimeout(resolve, timeoutMs))

export async function applyTimeout<T, E>(
  promise: Promise<T>,
  timeoutMs: number,
  getTimeoutResult: () => E = () => {
    throw CustomError("PromiseTimeoutError", `Promise timed out after ${timeoutMs}ms`, { timeout: timeoutMs })
  }
): Promise<T | E> {
  return Promise.race([promise, delay(timeoutMs).then(() => getTimeoutResult())])
}
