/* tslint:disable:no-string-literal */

import * as JWT from "jsonwebtoken"
import PromiseQueue from "p-queue"
import React from "react"
import { Asset, Server, StellarTomlResolver, Transaction } from "stellar-sdk"
import * as WebAuth from "@satoshipay/stellar-sep-10"
import {
  SigningKeyCacheContext,
  StellarAccountDataCacheContext,
  StellarAddressCacheContext,
  StellarAddressReverseCacheContext,
  StellarTomlCacheContext,
  WebAuthTokenCacheContext
} from "../context/caches"
import { StellarContext } from "../context/stellar"
import { createEmptyAccountData, AccountData } from "../lib/account"
import { FetchState } from "../lib/async"
import * as StellarAddresses from "../lib/stellar-address"
import { StellarToml, StellarTomlCurrency } from "../types/stellar-toml"

export function useHorizon(testnet: boolean = false) {
  const stellar = React.useContext(StellarContext)
  return testnet ? stellar.horizonTestnet : stellar.horizonLivenet
}

const dedupe = <T>(array: T[]) => Array.from(new Set(array))

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
    fetchChallenge: WebAuth.fetchChallenge,

    async fetchWebAuthData(horizon: Server, issuerAccountID: string) {
      const metadata = await WebAuth.fetchWebAuthData(horizon, issuerAccountID)
      if (metadata) {
        signingKeys.store(metadata.signingKey, metadata.domain)
      }
      return metadata
    },

    getCachedAuthToken(endpointURL: string, localPublicKey: string) {
      return webauthTokens.cache.get(createCacheKey(endpointURL, localPublicKey))
    },

    async postResponse(endpointURL: string, transaction: Transaction) {
      const manageDataOperation = transaction.operations.find(operation => operation.type === "manageData")
      const localPublicKey = manageDataOperation ? manageDataOperation.source : undefined
      const authToken = await WebAuth.postResponse(endpointURL, transaction)

      if (localPublicKey) {
        const decoded = JWT.decode(authToken) as any
        const maxAge = decoded.exp ? Number.parseInt(decoded.exp, 10) * 1000 - Date.now() - 60_000 : undefined
        webauthTokens.store(createCacheKey(endpointURL, localPublicKey), authToken, maxAge)
      }
      return authToken
    }
  }
}

const createStellarTomlCacheKey = (domain: string) => `cache:stellar.toml:${domain}`

export function useStellarTomlFiles(domains: string[]): Map<string, [StellarToml, boolean]> {
  const stellarTomls = React.useContext(StellarTomlCacheContext)
  const resultMap = new Map<string, [StellarToml, boolean]>()

  React.useEffect(() => {
    for (const domain of domains) {
      // This is semantically different from `.filter()`-ing the domains before the loop,
      // since this will prevent double-fetching from domains that were part of this iteration
      if (stellarTomls.cache.has(domain)) {
        continue
      }

      stellarTomls.store(domain, FetchState.pending())

      StellarTomlResolver.resolve(domain)
        .then(stellarTomlData => {
          stellarTomls.store(domain, FetchState.resolved(stellarTomlData))
          localStorage.setItem(createStellarTomlCacheKey(domain), JSON.stringify(stellarTomlData))
        })
        .catch(error => {
          stellarTomls.store(domain, FetchState.rejected(error))
        })
    }
  }, [domains.join(","), stellarTomls])

  for (const domain of domains) {
    const cached = stellarTomls.cache.get(domain)

    if (cached && cached.state === "resolved") {
      resultMap.set(domain, [cached.data, false])
    } else if (cached && cached.state === "rejected") {
      const persistentlyCached = localStorage.getItem(createStellarTomlCacheKey(domain))
      resultMap.set(domain, [persistentlyCached ? JSON.parse(persistentlyCached) : undefined, false])
    } else {
      const persistentlyCached = localStorage.getItem(createStellarTomlCacheKey(domain))
      resultMap.set(domain, [persistentlyCached ? JSON.parse(persistentlyCached) : undefined, true])
    }
  }

  return resultMap
}

export function useStellarToml(domain: string | null | undefined): [StellarToml | undefined, boolean] {
  const tomlFiles = useStellarTomlFiles(domain ? [domain] : [])
  return domain ? tomlFiles.get(domain)! : [undefined, false]
}

// Limit the number of concurrent fetches
const accountFetchQueue = new PromiseQueue({ concurrency: 8 })

function useAccountDataSet(horizon: Server, accountIDs: string[]): AccountData[] {
  const loadingStates = React.useContext(StellarAccountDataCacheContext)

  const issuerAccounts = accountIDs.map(
    (accountID: string): AccountData => {
      const cacheItem = loadingStates.cache.get(accountID)
      return cacheItem && cacheItem.state === "resolved" ? cacheItem.data : createEmptyAccountData(accountID)
    }
  )

  React.useEffect(() => {
    for (const accountID of accountIDs) {
      if (!loadingStates.cache.has(accountID)) {
        loadingStates.store(accountID, FetchState.pending())

        accountFetchQueue.add(async () => {
          try {
            const account = await horizon.loadAccount(accountID)
            loadingStates.store(accountID, FetchState.resolved(account))
          } catch (error) {
            loadingStates.store(accountID, FetchState.rejected(error))
          }
        })
      }
    }
  }, [accountIDs.join(",")])

  return issuerAccounts
}

export function useAccountData(publicKey: string, testnet: boolean) {
  const horizon = useHorizon(testnet)
  return useAccountDataSet(horizon, [publicKey])[0]
}

export function useAssetMetadata(assets: Asset[], testnet: boolean) {
  const horizon = useHorizon(testnet)
  const issuerAccountIDs = dedupe(assets.filter(asset => !asset.isNative()).map(asset => asset.getIssuer()))
  const accountDataSet = useAccountDataSet(horizon, issuerAccountIDs)

  const domains = accountDataSet
    .map(accountData => accountData.home_domain)
    .filter((domain): domain is string => Boolean(domain))

  const resultMap = new WeakMap<Asset, [StellarTomlCurrency | undefined, boolean]>()
  const stellarTomlFiles = useStellarTomlFiles(domains)

  for (const asset of assets) {
    const assetCode = asset.isNative() ? undefined : asset.getCode()
    const issuerAccountID = asset.isNative() ? undefined : asset.getIssuer()
    const accountData = issuerAccountID
      ? accountDataSet.find(someAccountData => someAccountData.account_id === issuerAccountID)
      : undefined
    const domain = accountData ? accountData.home_domain : undefined
    const [stellarTomlData, loading] = domain ? stellarTomlFiles.get(domain)! : [undefined, false]

    const assetMetadata =
      stellarTomlData && stellarTomlData["CURRENCIES"] && Array.isArray(stellarTomlData["CURRENCIES"])
        ? stellarTomlData["CURRENCIES"].find(
            (currency: any) => currency.code === assetCode && currency.issuer === issuerAccountID
          )
        : undefined

    resultMap.set(asset, [assetMetadata, loading])
  }

  return resultMap
}
