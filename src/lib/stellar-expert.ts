import { spawn, Worker, Thread } from "threads"
import { Fetcher } from "../workers/fetch-worker"

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

  if (cachedAccountsString && timestamp && +timestamp > Date.now() - 24 * 60 * 60 * 1000) {
    // use cached accounts if they are not older than 24h
    return JSON.parse(cachedAccountsString)
  } else {
    const fetcher = await spawn<Fetcher>(new Worker("../workers/fetch-worker.ts"))
    const knownAccounts = await fetcher.fetchWellknownAccounts(testnet)
    await Thread.terminate(fetcher)

    localStorage.setItem(cacheKey, JSON.stringify(knownAccounts))
    localStorage.setItem("known-accounts:timestamp", Date.now().toString())
    return knownAccounts
  }
}
