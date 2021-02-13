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
  const [xlmPrice, setXlmPrice] = React.useState<number>(0)

  React.useEffect(() => {
    fetchCryptoPrice(currency, testnet).then(setXlmPrice)

    const interval = setInterval(() => {
      fetchCryptoPrice(currency, testnet).then(setXlmPrice)
    }, 60 * 1000)

    return () => clearInterval(interval)
  }, [currency, testnet])

  const conversion = React.useMemo(() => {
    return {
      xlmPrice,
      convertXLM(amount: number | BigNumber): BigNumber {
        return BigNumber(xlmPrice).mul(BigNumber(amount))
      }
    }
  }, [xlmPrice])

  return conversion
}

export function useFiatEstimate(asset: Asset, currency: CurrencyCode, testnet: boolean) {
  const conversion = usePriceConversion(currency, testnet)
  const nativeAsset = React.useMemo(() => Asset.native(), [])
  const tradePair = useLiveOrderbook(asset, nativeAsset, testnet)

  const fiatEstimate = React.useMemo(() => {
    if (asset.getAssetType() === "native") {
      return {
        estimatedPrice: conversion.xlmPrice,
        convertAmount(amount: number | BigNumber) {
          return BigNumber(conversion.convertXLM(amount))
        }
      }
    } else {
      const bestOffers = tradePair.bids
      const bestOffer = bestOffers.length ? bestOffers[0] : undefined
      const bestPrice = bestOffer ? Number(bestOffer.price) : 0

      return {
        estimatedPrice: bestPrice,
        convertAmount(amount: number | BigNumber) {
          return BigNumber(conversion.convertXLM(bestPrice * +amount))
        }
      }
    }
  }, [asset, conversion, tradePair.bids])

  return fiatEstimate
}

export function useAssetEstimate(currency: CurrencyCode, asset: Asset, testnet: boolean) {
  const conversion = usePriceConversion(currency, testnet)
  const nativeAsset = React.useMemo(() => Asset.native(), [])
  const tradePair = useLiveOrderbook(nativeAsset, asset, testnet)

  const assetPrice = React.useMemo(
    () => (conversion.xlmPrice > 0 ? BigNumber(1).div(conversion.xlmPrice) : BigNumber(0)),
    [conversion.xlmPrice]
  )

  const assetEstimate = React.useMemo(() => {
    if (asset.getAssetType() === "native") {
      return {
        estimatedPrice: assetPrice,
        convertAmount(amount: number | BigNumber) {
          return assetPrice.mul(amount)
        }
      }
    } else {
      const bestOffers = tradePair.bids
      const bestOffer = bestOffers.length ? bestOffers[0] : undefined
      const bestPrice = bestOffer ? Number(bestOffer.price) : 0

      return {
        estimatedPrice: assetPrice.mul(bestPrice),
        convertAmount(amount: number | BigNumber) {
          return assetPrice.mul(bestPrice).mul(amount)
        }
      }
    }
  }, [asset, assetPrice, tradePair.bids])

  return assetEstimate
}
