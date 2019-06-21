import LRUCache from "lru-cache"
import React from "react"
import { FederationServer } from "stellar-sdk"

// Just to make the cache types more readable
type CacheKey = string
type Domain = string
type JWT = string
type PublicKey = string
type StellarAddress = string

interface Props {
  children: React.ReactNode
}

interface ContextType {
  signingKeyDomain: LRUCache<PublicKey, Domain>
  stellarAddresses: LRUCache<StellarAddress, FederationServer.Record>
  stellarAddressesReverse: LRUCache<PublicKey, StellarAddress>
  webauthTokens: LRUCache<CacheKey, JWT>
}

const initialValues: ContextType = {
  signingKeyDomain: new LRUCache({
    max: 100
  }),
  stellarAddresses: new LRUCache({
    max: 1000,
    maxAge: 10 * 60 * 1000 // 10 mins
  }),
  stellarAddressesReverse: new LRUCache({
    max: 1000,
    maxAge: 60 * 60 * 1000 // 60 mins (long TTL, since reverse lookup is purely informational)
  }),
  webauthTokens: new LRUCache({
    max: 100
  })
}

const CachingContext = React.createContext<ContextType>(initialValues)

export function CachingProvider(props: Props) {
  // We don't even re-render on new cache entries, we just mutate the caches
  // Reasoning: We cache entries *before* they are actually being re-used, so re-rendering
  //            when a new entry is added is not necessary.

  const [contextValue] = React.useState<ContextType>(initialValues)
  return <CachingContext.Provider value={contextValue}>{props.children}</CachingContext.Provider>
}

export { ContextType as CachingContextType, CachingContext }
