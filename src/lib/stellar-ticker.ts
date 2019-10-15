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

export async function fetchAllAssets(testnet: boolean): Promise<AssetRecord[]> {
  const storageKey = testnet ? "known-assets:testnet" : "known-assets:mainnet"
  const requestURL = testnet
    ? "https://ticker-testnet.stellar.org/assets.json"
    : "https://ticker.stellar.org/assets.json"

  const cachedAssetsString = localStorage.getItem(storageKey)
  const timestamp = localStorage.getItem("known-assets:timestamp")

  if (cachedAssetsString && timestamp && +timestamp > Date.now() - 24 * 60 * 60 * 1000) {
    // use cached assets if they are not older than 24h
    return JSON.parse(cachedAssetsString)
  } else {
    const response = await fetch(requestURL)

    if (response.status >= 400) {
      throw Error(`Bad response (${response.status}) from stellar.expert server`)
    }

    const json = await response.json()
    const allAssets = json.assets as AssetRecord[]
    const abbreviatedAssets = allAssets.sort(byAccountCountSorter).map(record => trimAccountRecord(record))

    localStorage.setItem(storageKey, JSON.stringify(abbreviatedAssets))
    localStorage.setItem("known-assets:timestamp", Date.now().toString())

    return abbreviatedAssets
  }
}
