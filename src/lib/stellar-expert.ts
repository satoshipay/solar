import { workers } from "../worker-controller"

export interface AccountRecord {
  address: string
  paging_token: string
  name: string
  tags: string[]
  domain: string
  accepts?: {
    memo: "MEMO_TEXT" | "MEMO_ID"
  }
}

export async function fetchWellknownAccounts(testnet: boolean): Promise<AccountRecord[]> {
  const cacheKey = testnet ? "known-accounts:testnet" : "known-accounts:mainnet"

  const cachedAccountsString = localStorage.getItem(cacheKey)
  const timestamp = localStorage.getItem("known-accounts:timestamp")

  const { netWorker } = await workers

  if (cachedAccountsString && timestamp && +timestamp > Date.now() - 24 * 60 * 60 * 1000) {
    // use cached accounts if they are not older than 24h
    return JSON.parse(cachedAccountsString)
  } else {
    const knownAccounts = await netWorker.fetchWellknownAccounts(testnet)

    localStorage.setItem(cacheKey, JSON.stringify(knownAccounts))
    localStorage.setItem("known-accounts:timestamp", Date.now().toString())
    return knownAccounts
  }
}
