import React from "react"
import { Asset } from "stellar-sdk"
import {
  fetchAssetTransferInfos,
  fetchTransferServers,
  AssetTransferInfo,
  EmptyAssetTransferInfo
} from "@satoshipay/sep-6"
import { trackError } from "../../context/notifications"
import { useHorizon } from "../../hooks"

interface AssetTransferInfos {
  data: {
    [assetCode: string]: AssetTransferInfo | EmptyAssetTransferInfo
  }
  loading: boolean
}

const emptyTransferInfo = {
  deposit: undefined,
  transferInfo: undefined,
  withdraw: undefined
}

const transferInfosCache = new Map<string, AssetTransferInfo | EmptyAssetTransferInfo>()
const transferInfosLoading = new Map<string, Promise<any>>()

function getAssetCacheKey(asset: Asset, testnet: boolean) {
  return [asset.getIssuer() + asset.getCode(), testnet ? "testnet" : ""].join(":")
}

export function useAssetTransferServerInfos(assets: Asset[], testnet: boolean): AssetTransferInfos {
  // To force-update the component once an async fetch is completed
  const [completedFetches, setCompletedFetches] = React.useState(0)

  const horizon = useHorizon(testnet)
  const loadingPromiseCacheKey = assets.map(asset => getAssetCacheKey(asset, testnet)).join(",")
  const uncachedAssets = assets.filter(asset => !transferInfosCache.has(asset.getCode()))

  const fetchData = async () => {
    const transferServers = await fetchTransferServers(horizon, uncachedAssets)
    const transferInfos = await fetchAssetTransferInfos(transferServers)

    for (const [asset, transferInfo] of Array.from(transferInfos.entries())) {
      transferInfosCache.set(getAssetCacheKey(asset, testnet), transferInfo)
    }

    setCompletedFetches(completedFetches + 1)
  }

  React.useEffect(
    () => {
      if (uncachedAssets.length > 0 && !transferInfosLoading.has(loadingPromiseCacheKey)) {
        const promise = fetchData()
        transferInfosLoading.set(loadingPromiseCacheKey, promise)
        promise.catch(trackError)
      } else {
        // Nothing to do
      }
    },
    [loadingPromiseCacheKey]
  )

  const data = assets.reduce<AssetTransferInfos["data"]>((reduced, asset) => {
    const cacheItem = transferInfosCache.get(getAssetCacheKey(asset, testnet))
    return {
      ...reduced,
      [asset.getCode()]: cacheItem || emptyTransferInfo
    }
  }, {})
  return {
    data,
    loading: uncachedAssets.length > 0
  }
}
