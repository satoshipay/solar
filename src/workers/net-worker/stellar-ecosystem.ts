import { FederationServer, StellarTomlResolver } from "stellar-sdk"
import { AccountRecord } from "../../lib/stellar-expert"
import { AssetRecord } from "../../lib/stellar-ticker"
import { CustomError } from "../../lib/errors"

export async function fetchWellknownAccounts(testnet: boolean): Promise<AccountRecord[]> {
  const requestURL = testnet
    ? "https://api.stellar.expert/api/explorer/testnet/directory"
    : "https://api.stellar.expert/api/explorer/public/directory"

  const response = await fetch(requestURL)

  if (response.status >= 400) {
    throw CustomError("BadResponseError", `Bad response (${response.status}) from stellar.expert server`, {
      status: response.status,
      server: "stellar.expert"
    })
  }

  const json = await response.json()
  const knownAccounts = json._embedded.records as AccountRecord[]
  return knownAccounts
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

export async function fetchAllAssets(tickerURL: string): Promise<AssetRecord[]> {
  const requestURL = new URL("/assets.json", tickerURL)
  const response = await fetch(String(requestURL))

  if (response.status >= 400) {
    throw CustomError("BadResponseError", `Bad response (${response.status}) from stellar.expert server`, {
      status: response.status,
      server: "stellar.expert"
    })
  }

  const json = await response.json()
  const allAssets = json.assets as AssetRecord[]
  const abbreviatedAssets = allAssets.sort(byAccountCountSorter).map(record => trimAccountRecord(record))
  return abbreviatedAssets
}

export async function fetchStellarToml(domain: string): Promise<any> {
  try {
    return await StellarTomlResolver.resolve(domain)
  } catch (error) {
    // tslint:disable-next-line no-console
    console.warn(`Could not resolve stellar.toml data for domain ${domain}:`, error)
    return undefined
  }
}

export function resolveStellarAddress(address: string, options?: FederationServer.Options) {
  return FederationServer.resolve(address, options)
}
