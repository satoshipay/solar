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
  const requestURL = testnet
    ? "https://api.stellar.expert/api/explorer/testnet/directory"
    : "https://api.stellar.expert/api/explorer/public/directory"

  const cachedAccountsString = localStorage.getItem(cacheKey)
  const timestamp = localStorage.getItem("known-accounts:timestamp")

  if (cachedAccountsString && timestamp && +timestamp > Date.now() - 24 * 60 * 60 * 1000) {
    // use cached accounts if they are not older than 24h
    return JSON.parse(cachedAccountsString)
  } else {
    const response = await fetch(requestURL)

    if (response.status >= 400) {
      throw Error(`Bad response (${response.status}) from stellar.expert server`)
    }

    const json = await response.json()
    const knownAccounts = json._embedded.records as AccountRecord[]
    localStorage.setItem(cacheKey, JSON.stringify(knownAccounts))
    localStorage.setItem("known-accounts:timestamp", Date.now().toString())
    return knownAccounts
  }
}
