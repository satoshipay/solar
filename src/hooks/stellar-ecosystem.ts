import React from "react"
import { trackError } from "../context/notifications"
import { AccountRecord, fetchWellknownAccounts } from "../lib/stellar-expert"
import { AssetRecord, fetchAllAssets } from "../lib/stellar-ticker"
import { tickerAssetsCache, wellKnownAccountsCache } from "./_caches"
import { useForceRerender } from "./util"

export { AccountRecord, AssetRecord }

export function useTickerAssets(testnet: boolean) {
  const fetchAssets = () => fetchAllAssets(testnet)
  return tickerAssetsCache.get(testnet) || tickerAssetsCache.suspend(testnet, fetchAssets)
}

export function useWellKnownAccounts(testnet: boolean) {
  let accounts: AccountRecord[]

  const forceRerender = useForceRerender()
  const fetchAccounts = () => fetchWellknownAccounts(testnet)

  try {
    accounts = wellKnownAccountsCache.get(testnet) || wellKnownAccountsCache.suspend(testnet, fetchAccounts)
  } catch (thrown) {
    if (thrown && typeof thrown.then === "function") {
      // Promise thrown to suspend component – prevent suspension
      accounts = []
      thrown.then(forceRerender, trackError)
    } else {
      // It's an error – re-throw
      throw thrown
    }
  }

  const wellknownAccounts = React.useMemo(() => {
    return {
      accounts,
      lookup(publicKey: string): AccountRecord | undefined {
        return accounts.find(account => account.address === publicKey)
      }
    }
  }, [accounts])

  return wellknownAccounts
}
