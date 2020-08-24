import BigNumber from "big.js"
import React from "react"
import { trackError } from "~App/contexts/notifications"
import { AccountRecord, fetchWellknownAccounts } from "../lib/stellar-expert"
import { AssetRecord, fetchAllAssets } from "../lib/stellar-ticker"
import { CurrencyCode, fetchCryptoPrice } from "../lib/currency-conversion"
import { tickerAssetsCache, wellKnownAccountsCache } from "./_caches"
import { useForceRerender } from "./util"
import { Asset } from "stellar-sdk"
import { useLiveOrderbook } from "./stellar-subscriptions"

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

export function usePriceConversion(currency: CurrencyCode, testnet: boolean) {
  const [price, setPrice] = React.useState<number>(0)

  React.useEffect(() => {
    fetchCryptoPrice(currency, testnet).then(setPrice)

    const interval = setInterval(() => {
      fetchCryptoPrice(currency, testnet).then(setPrice)
    }, 60 * 1000)

    return () => clearInterval(interval)
  }, [currency, testnet])

  const conversion = React.useMemo(() => {
    return {
      price,
      convertXLM(amount: number): number {
        return price * amount
      }
    }
  }, [price])

  return conversion
}

export function useFiatEstimate(asset: Asset, currency: CurrencyCode, testnet: boolean) {
  const conversion = usePriceConversion(currency, testnet)
  const tradePair = useLiveOrderbook(asset, Asset.native(), testnet)

  if (asset.getAssetType() === "native") {
    return {
      estimatedPrice: conversion.price,
      convertAmount(amount: number) {
        return BigNumber(conversion.convertXLM(amount))
      }
    }
  } else {
    const bestOffers = tradePair.bids
    const bestOffer = bestOffers.length ? bestOffers[0] : undefined
    const bestPrice = bestOffer ? Number(bestOffer.price) : 0

    return {
      estimatedPrice: bestPrice,
      convertAmount(amount: number) {
        return BigNumber(conversion.convertXLM(bestPrice * amount))
      }
    }
  }
}
