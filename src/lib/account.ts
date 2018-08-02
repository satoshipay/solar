import { Server } from "stellar-sdk"

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function loadAccount(horizon: Server, accountPubKey: string) {
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

export async function waitForAccountData(horizon: Server, accountPubKey: string) {
  let accountData = null

  while (true) {
    accountData = await loadAccount(horizon, accountPubKey)

    if (accountData) {
      break
    } else {
      await delay(5000)
    }
  }

  return accountData
}
