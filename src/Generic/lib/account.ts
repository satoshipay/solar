import { AccountResponse, Horizon } from "stellar-sdk"

// Horizon.BalanceLine without Horizon.BalanceLineLiquidityPool
export type BalanceLine = Horizon.BalanceLineAsset | Horizon.BalanceLineNative

export interface AccountData {
  account_id: AccountResponse["account_id"]
  balances: BalanceLine[]
  data_attr: AccountResponse["data_attr"]
  flags: AccountResponse["flags"]
  home_domain?: string
  id: string
  inflation_destination?: string
  paging_token: AccountResponse["paging_token"]
  signers: Horizon.AccountSigner[]
  subentry_count: number
  thresholds: Horizon.AccountThresholds
}

export const createEmptyAccountData = (accountID: string): AccountData => ({
  account_id: accountID,
  balances: [],
  data_attr: {},
  flags: {
    auth_immutable: false,
    auth_required: false,
    auth_revocable: false,
    auth_clawback_enabled: false
  },
  id: accountID,
  paging_token: "",
  signers: [],
  subentry_count: 0,
  thresholds: {
    low_threshold: 0,
    med_threshold: 0,
    high_threshold: 0
  }
})
