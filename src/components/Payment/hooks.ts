import React from "react"
import { Asset } from "stellar-sdk"
import {
  fetchAssetTransferInfos,
  fetchTransferServers,
  AssetTransferInfo,
  EmptyAssetTransferInfo,
  TransferServer
} from "@satoshipay/sep-6"
import { trackError } from "../../context/notifications"
import { useHorizon } from "../../hooks"

interface ExtendedTransferInfo {
  transferInfo: AssetTransferInfo | EmptyAssetTransferInfo
  transferServer: TransferServer | null
}

export interface AssetTransferInfos {
  data: {
    [assetCode: string]: ExtendedTransferInfo
  }
  loading: boolean
}

const emptyTransferInfo = {
  deposit: undefined,
  transferInfo: undefined,
  withdraw: undefined
}

const transferInfosCache = new Map<string, ExtendedTransferInfo>()
const transferInfosLoading = new Map<string, Promise<any>>()

function getAssetCacheKey(asset: Asset, testnet: boolean) {
  return [asset.getIssuer() + asset.getCode(), testnet ? "testnet" : ""].join(":")
}

export function useAssetTransferServerInfos(assets: Asset[], testnet: boolean): AssetTransferInfos {
  // To force-update the component once an async fetch is completed
  const [completedFetches, setCompletedFetches] = React.useState(0)

  const horizon = useHorizon(testnet)
  const loadingPromiseCacheKey = assets.map(asset => getAssetCacheKey(asset, testnet)).join(",")
  const uncachedAssets = assets.filter(asset => !transferInfosCache.has(getAssetCacheKey(asset, testnet)))

  const fetchData = async () => {
    const updatedTransferServers = await fetchTransferServers(horizon, uncachedAssets)
    const transferInfos = await fetchAssetTransferInfos(updatedTransferServers)

    for (const [asset, transferInfo] of Array.from(transferInfos.entries())) {
      const transferServer = updatedTransferServers.get(asset) || null
      transferInfosCache.set(getAssetCacheKey(asset, testnet), { transferInfo, transferServer })
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
      [asset.getCode()]: cacheItem || { transferInfo: emptyTransferInfo, transferServer: null }
    }
  }, {})

  return {
    data,
    loading: uncachedAssets.length > 0
  }
}

export function usePolling(pollIntervalMs: number) {
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null)

  const start = (callback: () => any) => {
    if (!intervalRef.current) {
      intervalRef.current = setInterval(async () => {
        try {
          await callback()
        } catch (error) {
          trackError(error)
        }
      }, pollIntervalMs)
    }
  }

  const stop = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
  }

  React.useEffect(() => {
    // Don't automatically start polling on mount, but definitely stop polling on unmount
    return () => stop()
  }, [])

  return {
    start,
    stop
  }
}
