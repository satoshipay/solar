import { workers } from "../worker-controller"

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

export async function fetchAllAssets(testnet: boolean): Promise<AssetRecord[]> {
  const storageKey = testnet ? "known-assets:testnet" : "known-assets:mainnet"

  const cachedAssetsString = localStorage.getItem(storageKey)
  const timestamp = localStorage.getItem("known-assets:timestamp")

  if (cachedAssetsString && timestamp && +timestamp > Date.now() - 24 * 60 * 60 * 1000) {
    // use cached assets if they are not older than 24h
    return JSON.parse(cachedAssetsString)
  } else {
    const { netWorker } = await workers
    const allAssets = await netWorker.fetchAllAssets(testnet)

    localStorage.setItem(storageKey, JSON.stringify(allAssets))
    localStorage.setItem("known-assets:timestamp", Date.now().toString())

    return allAssets
  }
}
