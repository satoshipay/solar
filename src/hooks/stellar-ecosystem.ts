import React from "react"
import { TickerAssetsCacheContext, WellknownAccountsCacheContext } from "../context/caches"
import { AccountRecord } from "../lib/stellar-expert"
import { AssetRecord } from "../lib/stellar-ticker"

export { AccountRecord, AssetRecord }

export function useWellKnownAccounts(testnet: boolean) {
  const wellknownAccounts = React.useContext(WellknownAccountsCacheContext)
  const accounts = testnet ? wellknownAccounts.testnet() : wellknownAccounts.mainnet()

  return {
    accounts,
    lookup(publicKey: string): AccountRecord | undefined {
      return accounts.find(account => account.address === publicKey)
    }
  }
}

export function useStellarAssets(testnet: boolean) {
  const ticker = React.useContext(TickerAssetsCacheContext)
  return testnet ? ticker.testnet() : ticker.mainnet()
}
