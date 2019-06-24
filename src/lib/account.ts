import { Server } from "stellar-sdk"
import { Cancellation } from "./errors"

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function loadAccount(horizon: Server, accountPubKey: string) {
  try {
    return await horizon.loadAccount(accountPubKey)
  } catch (error) {
    if (error && error.response && error.response.status === 404) {
      return null
    } else {
      throw error
    }
  }
}

export async function waitForAccountData(horizon: Server, accountPubKey: string, shouldCancel?: () => boolean) {
  let accountData = null
  let initialFetchFailed = false

  while (true) {
    if (shouldCancel && shouldCancel()) {
      throw Cancellation("Stopping to wait for account to become present in network.")
    }

    accountData = await loadAccount(horizon, accountPubKey)

    if (accountData) {
      break
    } else {
      initialFetchFailed = true
      await delay(2500)
    }
  }

  return {
    accountData,
    initialFetchFailed
  }
}
