/* tslint:disable:no-string-literal */

import React from "react"
import { Asset, Networks, Server, Transaction, Horizon } from "stellar-sdk"
import {
  SigningKeyCacheContext,
  StellarAddressCacheContext,
  StellarAddressReverseCacheContext,
  WebAuthTokenCacheContext
} from "~App/contexts/caches"
import { StellarContext } from "~App/contexts/stellar"
import { workers } from "~Workers/worker-controller"
import { StellarToml, StellarTomlCurrency } from "~shared/types/stellar-toml"
import { createEmptyAccountData, AccountData } from "../lib/account"
import { createPersistentCache } from "../lib/persistent-cache"
import * as StellarAddresses from "../lib/stellar-address"
import { mapSuspendables } from "../lib/suspense"
import { accountDataCache, accountHomeDomainCache, stellarTomlCache } from "./_caches"
import { useNetWorker } from "./workers"

/** @deprecated */
export function useHorizon(testnet: boolean = false) {
  const horizonURLs = useHorizonURLs(testnet)
  const horizonURL = horizonURLs[0]

  return testnet ? new Server(horizonURL) : new Server(horizonURL)
}

export function useHorizonURLs(testnet: boolean = false) {
  const stellar = React.useContext(StellarContext)

  if (stellar.isSelectionPending) {
    throw stellar.pendingSelection
  }

  const horizonURLs = testnet ? stellar.testnetHorizonURLs : stellar.pubnetHorizonURLs
  return horizonURLs
}

export function useFederationLookup() {
  const lookup = React.useContext(StellarAddressCacheContext)
  const reverseLookup = React.useContext(StellarAddressReverseCacheContext)
  return {
    lookupFederationRecord(stellarAddress: string) {
      return StellarAddresses.lookupFederationRecord(stellarAddress, lookup.cache, reverseLookup.cache)
    },
    lookupStellarAddress(publicKey: string) {
      return reverseLookup.cache.get(publicKey)
    }
  }
}

export function useWebAuth() {
  const signingKeys = React.useContext(SigningKeyCacheContext)
  const webauthTokens = React.useContext(WebAuthTokenCacheContext)
  const createCacheKey = React.useCallback(
    (endpointURL: string, localPublicKey: string) => `${endpointURL}:${localPublicKey}`,
    []
  )

  return {
    async fetchChallenge(
      endpointURL: string,
      serviceSigningKey: string | null,
      localPublicKey: string,
      network: Networks
    ) {
      const { netWorker } = await workers
      const challenge = await netWorker.fetchWebAuthChallenge(endpointURL, serviceSigningKey, localPublicKey, network)
      return new Transaction(challenge, network)
    },

    async fetchWebAuthData(horizonURL: string, issuerAccountID: string) {
      const { netWorker } = await workers
      const metadata = await netWorker.fetchWebAuthData(horizonURL, issuerAccountID)
      if (metadata && metadata.signingKey) {
        signingKeys.store(metadata.signingKey, metadata.domain)
      }
      return metadata
    },

    getCachedAuthToken(endpointURL: string, localPublicKey: string) {
      return webauthTokens.cache.get(createCacheKey(endpointURL, localPublicKey))
    },

    async postResponse(endpointURL: string, transaction: Transaction, testnet: boolean) {
      const { netWorker } = await workers
      const manageDataOperation = transaction.operations.find(operation => operation.type === "manageData")
      const localPublicKey = manageDataOperation ? manageDataOperation.source : undefined

      const network = testnet ? Networks.TESTNET : Networks.PUBLIC
      const txXdr = transaction
        .toEnvelope()
        .toXDR()
        .toString("base64")

      const { authToken, decoded } = await netWorker.postWebAuthResponse(endpointURL, txXdr, network)

      if (localPublicKey) {
        const maxAge = decoded.exp ? Number.parseInt(decoded.exp, 10) * 1000 - Date.now() - 60_000 : undefined
        webauthTokens.store(createCacheKey(endpointURL, localPublicKey), authToken, maxAge)
      }
      return authToken
    }
  }
}

const stellarTomlPersistentCache = createPersistentCache<StellarToml>("stellar.toml", {
  expiresIn: 24 * 60 * 60_000,
  maxItems: 50
})

export function useStellarToml(domain: string | undefined): StellarToml | undefined {
  if (!domain) {
    return undefined
  }

  const fetchStellarTomlData = async (): Promise<[true, any]> => {
    const { netWorker } = await workers
    const stellarTomlData = await netWorker.fetchStellarToml(domain)

    stellarTomlPersistentCache.save(domain, stellarTomlData || null)
    return [true, stellarTomlData]
  }

  const cached = stellarTomlCache.get(domain)

  if (cached && cached[0]) {
    return cached[1]
  }

  return stellarTomlPersistentCache.read(domain) || stellarTomlCache.suspend(domain, fetchStellarTomlData)
}

export function useAccountData(accountID: string, testnet: boolean) {
  const horizonURLs = useHorizonURLs(testnet)
  const netWorker = useNetWorker()

  const selector = [horizonURLs, accountID] as const
  const cached = accountDataCache.get(selector)

  const prepare = (account: Horizon.AccountResponse | null): AccountData =>
    account ? { ...account, data_attr: account.data } : createEmptyAccountData(accountID)

  if (!cached) {
    accountDataCache.suspend(selector, () => netWorker.fetchAccountData(horizonURLs, accountID).then(prepare))
  }
  return cached || createEmptyAccountData(accountID)
}

const homeDomainCachePubnet = createPersistentCache<string>("home_domain:pubnet", { expiresIn: 24 * 60 * 60_000 })
const homeDomainCacheTestnet = createPersistentCache<string>("home_domain:testnet", { expiresIn: 24 * 60 * 60_000 })

export function useAccountHomeDomains(
  accountIDs: string[],
  testnet: boolean,
  allowIncompleteResult?: boolean
): Array<string | undefined> {
  const horizonURLs = useHorizonURLs(testnet)
  const netWorker = useNetWorker()
  const [, setRerenderCounter] = React.useState(0)

  const forceRerender = () => setRerenderCounter(counter => counter + 1)

  const fetchHomeDomain = async (accountID: string): Promise<[string] | []> => {
    const accountData = await netWorker.fetchAccountData(horizonURLs, accountID)
    const homeDomain = accountData ? (accountData as any).home_domain : undefined
    if (homeDomain) {
      ;(testnet ? homeDomainCacheTestnet : homeDomainCachePubnet).save(accountID, homeDomain || null)
    }
    if (allowIncompleteResult) {
      forceRerender()
    }
    return homeDomain ? [homeDomain] : []
  }

  try {
    return mapSuspendables(accountIDs, accountID => {
      const selector = [horizonURLs, accountID] as const
      return (accountHomeDomainCache.get(selector) ||
        accountHomeDomainCache.suspend(selector, () => fetchHomeDomain(accountID)))[0]
    })
  } catch (thrown) {
    if (allowIncompleteResult && thrown && typeof thrown.then === "function") {
      const persistentlyCached = accountIDs.map(accountID =>
        (testnet ? homeDomainCacheTestnet : homeDomainCachePubnet).read(accountID)
      )

      if (persistentlyCached.every(element => typeof element === "string" && element)) {
        return persistentlyCached as string[]
      }
    }
    throw thrown
  }
}

export function useAccountHomeDomain(
  accountID: string | undefined,
  testnet: boolean,
  allowIncompleteResult?: boolean
): string | undefined {
  return useAccountHomeDomains(accountID ? [accountID] : [], testnet, allowIncompleteResult)[0]
}

/**
 * Same as `useAccountHomeDomain()`, but additionally checks
 */
export function useAccountHomeDomainSafe(
  accountID: string | undefined,
  testnet: boolean,
  allowIncompleteResult?: boolean
) {
  const homeDomain = useAccountHomeDomain(accountID, testnet, allowIncompleteResult)
  const stellarToml = useStellarToml(homeDomain)

  const matchesIssuingAccount =
    stellarToml && (stellarToml.CURRENCIES || []).some(currency => currency.issuer === accountID)
  const matchesSigningKey =
    stellarToml && (stellarToml.SIGNING_KEY === accountID || stellarToml.URI_REQUEST_SIGNING_KEY === accountID)

  return homeDomain && (matchesIssuingAccount || matchesSigningKey) ? homeDomain : undefined
}

export function useAssetMetadata(asset: Asset | undefined, testnet: boolean): StellarTomlCurrency | undefined {
  const assetCode = !asset || asset.isNative() ? undefined : asset.getCode()
  const issuerAccountID = !asset || asset.isNative() ? undefined : asset.getIssuer()
  const homeDomain = useAccountHomeDomain(issuerAccountID, testnet, true)
  const stellarTomlData = useStellarToml(homeDomain)

  if (stellarTomlData && stellarTomlData["CURRENCIES"] && Array.isArray(stellarTomlData["CURRENCIES"])) {
    const assetMetadata = stellarTomlData["CURRENCIES"].find(
      (currency: any) => currency.code === assetCode && currency.issuer === issuerAccountID
    )
    return assetMetadata
  } else {
    return undefined
  }
}
