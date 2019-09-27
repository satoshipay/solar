import React from "react"
import { FetchState } from "../lib/async"

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

export interface AssetRecord {
  code: string
  desc: string
  issuer: string
  issuer_detail: {
    name: string
    url: string
  }
  name: string
  num_accounts: number
  status: string
  type: string
}

function byAccountCountSorter(a: AssetRecord, b: AssetRecord) {
  return b.num_accounts - a.num_accounts
}

function trimAccountRecord(record: AssetRecord) {
  return {
    code: record.code,
    desc: record.desc,
    issuer: record.issuer,
    issuer_detail: {
      name: record.issuer_detail.name,
      url: record.issuer_detail.url
    },
    name: record.name,
    num_accounts: record.num_accounts,
    status: record.status,
    type: record.type
  }
}

export function useWellKnownAccounts() {
  const [loadingState, setLoadingState] = React.useState<FetchState<AccountRecord[]>>(FetchState.pending())

  React.useEffect(() => {
    const cachedAccountsString = localStorage.getItem("known-accounts")
    const timestamp = localStorage.getItem("known-accounts:timestamp")
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
          localStorage.setItem("known-accounts:timestamp", Date.now().toString())
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

export function useStellarAssets(testnet: boolean) {
  const [loadingState, setLoadingState] = React.useState<FetchState<AssetRecord[]>>(FetchState.pending())

  const storageKey = testnet ? "known-assets-testnet" : "known-assets"
  const requestURL = testnet
    ? "https://ticker-testnet.stellar.org/assets.json"
    : "https://ticker.stellar.org/assets.json"

  React.useEffect(() => {
    const cachedAssetsString = localStorage.getItem(storageKey)
    const timestamp = localStorage.getItem("known-assets:timestamp")

    if (cachedAssetsString && timestamp && +timestamp > Date.now() - 24 * 60 * 60 * 1000) {
      // use cached assets if they are not older than 24h
      const assets = JSON.parse(cachedAssetsString)
      setLoadingState(FetchState.resolved(assets))
    } else {
      fetch(requestURL).then(async response => {
        if (response.status >= 400) {
          setLoadingState(
            FetchState.rejected(new Error(`Bad response (${response.status}) from stellar.expert server`))
          )
        }

        try {
          const json = await response.json()
          const allAssets = json.assets as AssetRecord[]
          const abbreviatedAssets = allAssets.sort(byAccountCountSorter).map(record => trimAccountRecord(record))

          localStorage.setItem(storageKey, JSON.stringify(abbreviatedAssets))
          localStorage.setItem("known-assets:timestamp", Date.now().toString())
          setLoadingState(FetchState.resolved(abbreviatedAssets))
        } catch (error) {
          setLoadingState(FetchState.rejected(error))
        }
      })
    }
  }, [])

  return {
    getAll(): AssetRecord[] | undefined {
      if (loadingState.state === "resolved") {
        const assets = loadingState.data
        return assets
      } else {
        return undefined
      }
    }
  }
}
