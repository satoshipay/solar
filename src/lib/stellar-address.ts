import LRUCache from "lru-cache"
import { FederationServer } from "stellar-sdk"

type AccountID = string
type StellarAddress = string

const lookupCache = new LRUCache<StellarAddress, FederationServer.Record>({
  max: 1000,
  maxAge: 10 * 60 * 1000 // 10 mins
})

const reverseLookupCache = new LRUCache<AccountID, StellarAddress>({
  max: 1000,
  maxAge: 60 * 60 * 1000 // 60 mins (long TTL, since reverse lookup is purely informational)
})

export async function lookupFederationRecord(stellarAddress: string) {
  const cached = lookupCache.get(stellarAddress)
  if (cached) {
    return cached
  }

  let resolved: FederationServer.Record
  try {
    resolved = await FederationServer.resolve(stellarAddress)
  } catch (error) {
    if (error && error.request && !error.response) {
      throw new Error(`Request for resolving the stellar address failed: ${stellarAddress}`)
    } else if (error && error.response && error.response.status === 404) {
      throw new Error(`Stellar address not found: ${stellarAddress}`)
    } else {
      throw error
    }
  }
  lookupCache.set(stellarAddress, resolved)
  reverseLookupCache.set(resolved.account_id, stellarAddress)
  return resolved
}

export function queryReverseLookupCache(accountID: string) {
  return reverseLookupCache.get(accountID)
}
