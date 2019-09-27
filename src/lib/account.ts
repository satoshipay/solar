import { AccountResponse, Horizon, Server } from "stellar-sdk"
import { Cancellation } from "./errors"
import { isNotFoundError } from "./stellar"

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export interface AccountData {
  account_id: AccountResponse["account_id"]
  balances: Horizon.BalanceLine[]
  data_attr: AccountResponse["data_attr"]
  flags: AccountResponse["flags"]
  home_domain?: string
  id: string
  inflation_destination?: string
  signers: Horizon.AccountSigner[]
  thresholds: Horizon.AccountThresholds
}

export const createEmptyAccountData = (accountID: string): AccountData => ({
  account_id: accountID,
  balances: [],
  data_attr: {},
  flags: {
    auth_immutable: false,
    auth_required: false,
    auth_revocable: false
  },
  id: accountID,
  signers: [],
  thresholds: {
    low_threshold: 0,
    med_threshold: 0,
    high_threshold: 0
  }
})

export async function loadAccount(horizon: Server, accountPubKey: string) {
  try {
    return await horizon.loadAccount(accountPubKey)
  } catch (error) {
    if (isNotFoundError(error)) {
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
