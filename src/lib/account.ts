import { AccountResponse, Horizon } from "stellar-sdk"

export interface AccountData {
  account_id: AccountResponse["account_id"]
  balances: Horizon.BalanceLine[]
  data_attr: AccountResponse["data_attr"]
  flags: AccountResponse["flags"]
  home_domain?: string
  id: string
  inflation_destination?: string
  paging_token: AccountResponse["paging_token"]
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
  paging_token: "",
  signers: [],
  thresholds: {
    low_threshold: 0,
    med_threshold: 0,
    high_threshold: 0
  }
})
