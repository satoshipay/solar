import LRUCache from "lru-cache"
import { FederationServer } from "stellar-sdk"
import { workers } from "../worker-controller"
import { ComplexError } from "./errors"
import { isNotFoundError } from "./stellar"

export const isPublicKey = (str: string) => Boolean(str.match(/^G[A-Z0-9]{55}$/))
export const isStellarAddress = (str: string) =>
  Boolean(str.match(/^[^\*> \t\n\r]+\*[^\*\.> \t\n\r]+\.[^\*> \t\n\r]+$/))

export async function lookupFederationRecord(
  stellarAddress: string,
  lookupCache: LRUCache<string, FederationServer.Record>,
  reverseLookupCache: LRUCache<string, string>
) {
  const { netWorker } = await workers
  const cached = lookupCache.get(stellarAddress)

  if (cached) {
    return cached
  }

  let resolved: FederationServer.Record
  try {
    resolved = await netWorker.resolveStellarAddress(stellarAddress)
  } catch (error) {
    if (error && error.request && !error.response) {
      throw ComplexError("RequestFailedError", `Request for resolving the stellar address failed: ${stellarAddress}`, {
        address: stellarAddress
      })
    } else if (isNotFoundError(error)) {
      throw ComplexError("AddressNotFoundError", `Stellar address not found: ${stellarAddress}`, {
        address: stellarAddress
      })
    } else {
      throw error
    }
  }
  lookupCache.set(stellarAddress, resolved)
  reverseLookupCache.set(resolved.account_id, stellarAddress)
  return resolved
}
