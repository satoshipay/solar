import { workers } from "~Workers/worker-controller"
import { createPersistentCache } from "./persistent-cache"

export interface AccountRecord {
  address: string
  paging_token: string
  name: string
  tags: string[]
  domain?: string
}

const wellKnownAccountsCache = createPersistentCache<AccountRecord[]>("known-accounts", { expiresIn: 24 * 60 * 60_000 })

export async function fetchWellKnownAccount(accountID: string): Promise<AccountRecord | undefined> {
  const cacheKey = "all"
  const cachedAccounts = wellKnownAccountsCache.read(cacheKey)

  const { netWorker } = await workers

  const cachedAccount = cachedAccounts && cachedAccounts.find(account => account.address === accountID)

  if (cachedAccount) {
    return cachedAccount
  } else {
    const fetchedAccount = await netWorker.fetchWellknownAccount(accountID)

    if (fetchedAccount) {
      const newKnownAccounts: AccountRecord[] = cachedAccounts
        ? cachedAccounts.concat(fetchedAccount)
        : [fetchedAccount]

      wellKnownAccountsCache.save(cacheKey, newKnownAccounts)
    }

    return fetchedAccount || undefined
  }
}
