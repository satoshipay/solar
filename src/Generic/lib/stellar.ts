import BigNumber from "big.js"
import fetch from "isomorphic-fetch"
import { xdr, Asset, Horizon, Keypair, NotFoundError, Server, ServerApi, Transaction } from "stellar-sdk"
import { AssetRecord } from "../hooks/stellar-ecosystem"
import { AccountData } from "./account"

const MAX_INT64 = "9223372036854775807"

// Used as a fallback if fetching the friendbot href from horizon fails
const SDF_FRIENDBOT_HREF = "https://friendbot.stellar.org/{?addr}"

const dedupe = <T>(array: T[]) => Array.from(new Set(array))

// FIXME: Needs to be queried from horizon
export const BASE_RESERVE = 0.5

export const networkPassphrases = {
  mainnet: "Public Global Stellar Network ; September 2015",
  testnet: "Test SDF Network ; September 2015"
}

export function getAllSources(tx: Transaction) {
  return dedupe([
    tx.source,
    ...(tx.operations.map(operation => operation.source).filter(source => Boolean(source)) as string[])
  ])
}

// FIXME: Wait for proper solution in stellar-sdk: <https://github.com/stellar/js-stellar-sdk/pull/403>
export function isNotFoundError(error: any): error is NotFoundError {
  return (
    (error && error instanceof Error && error.message === "Request failed with status code 404") ||
    (error.response && error.response.status === 404)
  )
}

export function balancelineToAsset(balanceline: Horizon.BalanceLine): Asset {
  return balanceline.asset_type === "native"
    ? Asset.native()
    : new Asset(balanceline.asset_code, balanceline.asset_issuer)
}

/** Reversal of stringifyAsset() */
export function parseAssetID(assetID: string) {
  if (assetID === "XLM") {
    return Asset.native()
  } else {
    const [issuer, code] = assetID.split(":")
    return new Asset(code, issuer)
  }
}

export function stringifyAsset(assetOrTrustline: Asset | Horizon.BalanceLine) {
  if (assetOrTrustline instanceof Asset) {
    const asset: Asset = assetOrTrustline
    return asset.isNative() ? "XLM" : `${asset.getIssuer()}:${asset.getCode()}`
  } else {
    const line: Horizon.BalanceLine = assetOrTrustline
    return line.asset_type === "native" ? "XLM" : `${line.asset_issuer}:${line.asset_code}`
  }
}

export async function friendbotTopup(horizonURL: string, publicKey: string) {
  const horizonMetadata = await (await fetch(horizonURL)).json()
  const templatedFriendbotHref = horizonMetadata._links.friendbot.href || SDF_FRIENDBOT_HREF
  const friendBotHref = templatedFriendbotHref.replace(/\{\?.*/, "")

  const response = await fetch(friendBotHref + `?addr=${publicKey}`)
  return response.json()
}

export function getAccountMinimumBalance(accountData: Pick<AccountData, "subentry_count">) {
  return BigNumber(2) // 2 accounts for base reserve and signer reserve from own account
    .add(accountData.subentry_count)
    .mul(BASE_RESERVE)
}

export function getSpendableBalance(accountMinimumBalance: BigNumber, balanceLine?: Horizon.BalanceLine) {
  if (balanceLine !== undefined) {
    const fullBalance = BigNumber(balanceLine.balance)
    return balanceLine.asset_type === "native"
      ? fullBalance.minus(accountMinimumBalance).minus(balanceLine.selling_liabilities)
      : fullBalance.minus(balanceLine.selling_liabilities)
  } else {
    return BigNumber(0)
  }
}

export function getAssetsFromBalances(balances: Horizon.BalanceLine[]) {
  return balances.map(balance =>
    balance.asset_type === "native"
      ? Asset.native()
      : new Asset((balance as Horizon.BalanceLineAsset).asset_code, (balance as Horizon.BalanceLineAsset).asset_issuer)
  )
}

export function findMatchingBalanceLine(balances: Horizon.BalanceLine[], asset: Asset) {
  const matchingBalanceLine = balances.find(balance => {
    if (balance.asset_type === "native") {
      return asset.isNative()
    } else {
      return balance.asset_code === asset.getCode() && balance.asset_issuer === asset.getIssuer()
    }
  })
  return matchingBalanceLine
}

export function getHorizonURL(horizon: Server) {
  return horizon.serverURL.toString()
}

export function isSignedByAnyOf(signature: xdr.DecoratedSignature, publicKeys: string[]) {
  return publicKeys.some(publicKey => signatureMatchesPublicKey(signature, publicKey))
}

export function offerAssetToAsset(offerAsset: ServerApi.OfferAsset) {
  return offerAsset.asset_type === "native"
    ? Asset.native()
    : new Asset(offerAsset.asset_code as string, offerAsset.asset_issuer as string)
}

export function assetRecordToAsset(assetRecord: AssetRecord) {
  return assetRecord.issuer === "native" ? Asset.native() : new Asset(assetRecord.code, assetRecord.issuer)
}

export function signatureMatchesPublicKey(signature: xdr.DecoratedSignature, publicKey: string): boolean {
  const keypair = Keypair.fromPublicKey(publicKey)

  return signature.hint().equals(keypair.signatureHint())
}

export function trustlineLimitEqualsUnlimited(limit: string | number) {
  return String(limit).replace(".", "") === MAX_INT64
}
