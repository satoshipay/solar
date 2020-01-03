/* tslint:disable:no-string-literal */

import React from "react"
import { Asset, Networks, Server, Transaction, Horizon } from "stellar-sdk"
import {
  SigningKeyCacheContext,
  StellarAddressCacheContext,
  StellarAddressReverseCacheContext,
  WebAuthTokenCacheContext
} from "../context/caches"
import { StellarContext } from "../context/stellar"
import { createEmptyAccountData, AccountData } from "../lib/account"
import * as StellarAddresses from "../lib/stellar-address"
import { StellarToml, StellarTomlCurrency } from "../types/stellar-toml"
import { workers } from "../worker-controller"
import { accountDataCache, accountHomeDomainCache, stellarTomlCache } from "./_caches"
import { useNetWorker } from "./workers"

/** @deprecated */
export function useHorizon(testnet: boolean = false) {
  const stellar = React.useContext(StellarContext)
  return testnet ? new Server(stellar.testnetHorizonURL) : new Server(stellar.pubnetHorizonURL)
}

export function useHorizonURL(testnet: boolean = false) {
  const stellar = React.useContext(StellarContext)

  if (stellar.isSelectionPending) {
    throw stellar.pendingSelection
  }
  return testnet ? stellar.testnetHorizonURL : stellar.pubnetHorizonURL
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
    async fetchChallenge(endpointURL: string, serviceSigningKey: string, localPublicKey: string) {
      const { netWorker } = await workers
      return netWorker.fetchWebAuthChallenge(endpointURL, serviceSigningKey, localPublicKey)
    },

    async fetchWebAuthData(horizonURL: string, issuerAccountID: string) {
      const { netWorker } = await workers
      const metadata = await netWorker.fetchWebAuthData(horizonURL, issuerAccountID)
      if (metadata) {
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

const createStellarTomlCacheKey = (domain: string) => `cache:stellar.toml:${domain}`

export function useStellarToml(domain: string | undefined): StellarToml | undefined {
  if (!domain) {
    return undefined
  }

  const loadFromLocalStorage = () => {
    const cachedData = localStorage.getItem(createStellarTomlCacheKey(domain))
    return cachedData ? JSON.parse(cachedData) : undefined
  }

  const saveToLocalStorage = (data: any) => {
    localStorage.setItem(createStellarTomlCacheKey(domain), JSON.stringify(data || null))
  }

  const fetchStellarTomlData = async (): Promise<[true, any]> => {
    const { netWorker } = await workers
    const stellarTomlData = await netWorker.fetchStellarToml(domain)

    saveToLocalStorage(stellarTomlData)
    return [true, stellarTomlData]
  }

  const cached = stellarTomlCache.get(domain)

  if (cached && cached[0]) {
    return cached[1]
  }

  return loadFromLocalStorage() || stellarTomlCache.suspend(domain, fetchStellarTomlData)
}

export function useAccountData(accountID: string, testnet: boolean) {
  const horizonURL = useHorizonURL(testnet)
  const netWorker = useNetWorker()

  const selector = [horizonURL, accountID] as const
  const cached = accountDataCache.get(selector)

  const prepare = (account: Horizon.AccountResponse | null): AccountData =>
    account ? { ...account, data_attr: account.data } : createEmptyAccountData(accountID)

  if (!cached) {
    accountDataCache.suspend(selector, () => netWorker.fetchAccountData(horizonURL, accountID).then(prepare))
  }
  return cached || createEmptyAccountData(accountID)
}

function useAccountHomeDomain(accountID: string | undefined, testnet: boolean, allowIncompleteResult?: boolean) {
  const horizonURL = useHorizonURL(testnet)
  const netWorker = useNetWorker()
  const [, setRerenderCounter] = React.useState(0)

  const forceRerender = () => setRerenderCounter(counter => counter + 1)
  const selector = accountID ? ([horizonURL, accountID] as const) : undefined

  if (!accountID || !selector) {
    return undefined
  } else if (accountHomeDomainCache.has(selector)) {
    return accountHomeDomainCache.get(selector)
  } else {
    try {
      accountHomeDomainCache.suspend([horizonURL, accountID], async () => {
        const accountData = await netWorker.fetchAccountData(horizonURL, accountID)
        const homeDomain = accountData ? (accountData as any).home_domain : undefined
        if (homeDomain) {
          localStorage.setItem(`home_domain:${testnet ? "testnet" : "pubnet"}:${accountID}`, homeDomain)
        }
        if (allowIncompleteResult) {
          forceRerender()
        }
        return homeDomain
      })
    } catch (thrown) {
      if (allowIncompleteResult && thrown && typeof thrown.then === "function") {
        const persistentlyCached = localStorage.getItem(`home_domain:${testnet ? "testnet" : "pubnet"}:${accountID}`)
        if (persistentlyCached) {
          return persistentlyCached
        }
      }
      throw thrown
    }
    return undefined
  }
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
