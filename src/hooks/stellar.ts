/* tslint:disable:no-string-literal */

import * as JWT from "jsonwebtoken"
import React from "react"
import { Asset, Server, StellarTomlResolver, Transaction, ServerApi } from "stellar-sdk"
import * as WebAuth from "@satoshipay/stellar-sep-10"
import {
  SigningKeyCacheContext,
  StellarAddressCacheContext,
  StellarAddressReverseCacheContext,
  StellarIssuerAccountCacheContext,
  StellarTomlCacheContext,
  StellarTomlLoadingCacheContext,
  WebAuthTokenCacheContext
} from "../context/caches"
import { StellarContext } from "../context/stellar"
import { FetchState } from "../lib/async"
import * as StellarAddresses from "../lib/stellar-address"
import { StellarToml, StellarTomlCurrency } from "../types/stellar-toml"
import { AccountRecord } from "../types/well-known-accounts"

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
  const loadingStates = React.useContext(StellarTomlLoadingCacheContext)
  const resultMap = new Map<string, [StellarToml, boolean]>()

  React.useEffect(
    () => {
      for (const domain of domains) {
        // This is semantically different from `.filter()`-ing above, since this will
        // prevent double-fetching from domains that were part of this iteration
        if (stellarTomls.cache.has(domain) || loadingStates.cache.has(domain)) {
          continue
        }

        loadingStates.store(domain, FetchState.pending())

        StellarTomlResolver.resolve(domain)
          .then(stellarTomlData => {
            loadingStates.delete(domain)
            stellarTomls.store(domain, stellarTomlData)
            localStorage.setItem(createStellarTomlCacheKey(domain), JSON.stringify(stellarTomlData))
          })
          .catch(error => {
            loadingStates.store(domain, FetchState.rejected(error))
          })
      }
    },
    [domains, loadingStates, stellarTomls]
  )

  for (const domain of domains) {
    const cached = stellarTomls.cache.get(domain)
    const loadingState = loadingStates.cache.get(domain)

    if (cached) {
      resultMap.set(domain, [cached, false])
    } else if (loadingState && loadingState.state === "rejected") {
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

type IssuerAccountData = Pick<ServerApi.AccountRecord, "account_id" | "flags" | "home_domain">

function useFetchIssuerAccountDataSet(horizon: Server, accountIDs: string[]): IssuerAccountData[] {
  const loadingStates = React.useContext(StellarIssuerAccountCacheContext)

  const issuerAccounts = accountIDs.map(
    (accountID: string): IssuerAccountData => {
      const cacheItem = loadingStates.cache.get(accountID)
      return cacheItem && cacheItem.state === "resolved"
        ? cacheItem.data
        : {
            account_id: accountID,
            flags: {
              auth_immutable: false,
              auth_required: false,
              auth_revocable: false
            },
            home_domain: undefined
          }
    }
  )

  React.useEffect(
    () => {
      for (const accountID of accountIDs) {
        if (!loadingStates.cache.has(accountID)) {
          loadingStates.store(accountID, FetchState.pending())
          horizon
            .accounts()
            .accountId(accountID)
            .call()
            .then(
              account => loadingStates.store(accountID, FetchState.resolved(account)),
              error => loadingStates.store(accountID, FetchState.rejected(error))
            )
        }
      }
    },
    [accountIDs.join(",")]
  )

  return issuerAccounts
}

export function useAssetMetadata(assets: Asset[], testnet: boolean) {
  const horizon = useHorizon(testnet)
  const issuerAccountIDs = dedupe(assets.filter(asset => !asset.isNative()).map(asset => asset.getIssuer()))
  const accountDataSet = useFetchIssuerAccountDataSet(horizon, issuerAccountIDs)

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

export function useWellKnownAccounts() {
  const [loadingState, setLoadingState] = React.useState<FetchState<AccountRecord[]>>(FetchState.pending())

  React.useEffect(() => {
    const cachedAccountsString = localStorage.getItem("known-accounts")
    const timestamp = localStorage.getItem("timestamp")
    if (cachedAccountsString && timestamp && +timestamp > Date.now() - 24 * 60 * 60 * 1000) {
      // use cached accounts if they are not older than 24h
      const accounts = JSON.parse(cachedAccountsString)
      setLoadingState(FetchState.resolved(accounts))
    } else {
      fetch("https://api.stellar.expert/api/explorer/public/directory").then(async response => {
        if (response.status >= 400) {
          setLoadingState(
            FetchState.rejected(new Error(`Bad response (${response.status}) from stellar.expert server`))
          )
        }

        try {
          const json = await response.json()
          const knownAccounts = json._embedded.records as AccountRecord[]
          localStorage.setItem("known-accounts", JSON.stringify(knownAccounts))
          localStorage.setItem("timestamp", Date.now().toString())
          setLoadingState(FetchState.resolved(knownAccounts))
        } catch (error) {
          setLoadingState(FetchState.rejected(error))
        }
      })
    }
  }, [])

  return {
    lookup(publicKey: string): AccountRecord | undefined {
      if (loadingState.state === "resolved") {
        const accounts = loadingState.data
        return accounts.find(account => account.address === publicKey)
      } else {
        return undefined
      }
    }
  }
}
