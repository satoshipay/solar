import LRUCache from "lru-cache"
import { FederationServer } from "stellar-sdk"

export const isPublicKey = (str: string) => Boolean(str.match(/^G[A-Z0-9]{55}$/))
export const isStellarAddress = (str: string) =>
  Boolean(str.match(/^[^\*> \t\n\r]+\*[^\*\.> \t\n\r]+\.[^\*> \t\n\r]+$/))

export async function lookupFederationRecord(
  stellarAddress: string,
  lookupCache: LRUCache<string, FederationServer.Record>,
  reverseLookupCache: LRUCache<string, string>
) {
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
