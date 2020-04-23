import { workers } from "~Workers/worker-controller"
import { createPersistentCache } from "./persistent-cache"

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

const wellKnownAccountsCache = createPersistentCache<AccountRecord[]>("known-accounts", { expiresIn: 24 * 60 * 60_000 })

export async function fetchWellknownAccounts(testnet: boolean): Promise<AccountRecord[]> {
  const cacheKey = testnet ? "testnet" : "pubnet"
  const cachedAccounts = wellKnownAccountsCache.read(cacheKey)

  const { netWorker } = await workers

  if (cachedAccounts) {
    return cachedAccounts
  } else {
    const knownAccounts = await netWorker.fetchWellknownAccounts(testnet)

    wellKnownAccountsCache.save(cacheKey, knownAccounts)
    return knownAccounts
  }
}
