import React from "react"
import { AccountRecord, fetchWellKnownAccount } from "../lib/stellar-expert"
import { AssetRecord, fetchAllAssets } from "../lib/stellar-ticker"
import { tickerAssetsCache } from "./_caches"

export { AccountRecord, AssetRecord }

export function useTickerAssets(testnet: boolean) {
  const fetchAssets = () => fetchAllAssets(testnet)
  return tickerAssetsCache.get(testnet) || tickerAssetsCache.suspend(testnet, fetchAssets)
}

export function useWellKnownAccounts() {
  const wellknownAccounts = React.useMemo(() => {
    return {
      lookup(publicKey: string): Promise<AccountRecord | undefined> {
        return fetchWellKnownAccount(publicKey)
      }
    }
  }, [])

  return wellknownAccounts
}
