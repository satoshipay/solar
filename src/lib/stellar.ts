import BigNumber from "big.js"
import fetch from "isomorphic-fetch"
import { xdr, Horizon, Keypair, Server, Transaction } from "stellar-sdk"
import { joinURL } from "./url"

export interface SmartFeePreset {
  capacityTrigger: number
  maxFee: number
  percentile: number
}

// See <https://www.stellar.org/developers/horizon/reference/endpoints/fee-stats.html>
interface FeeStats {
  last_ledger: string
  last_ledger_base_fee: string
  ledger_capacity_usage: string
  min_accepted_fee: string
  mode_accepted_fee: string
  p10_accepted_fee: string
  p20_accepted_fee: string
  p30_accepted_fee: string
  p40_accepted_fee: string
  p50_accepted_fee: string
  p60_accepted_fee: string
  p70_accepted_fee: string
  p80_accepted_fee: string
  p90_accepted_fee: string
  p95_accepted_fee: string
  p99_accepted_fee: string
}

interface SignatureWithHint extends xdr.DecoratedSignature {
  hint(): Buffer
}

interface URI {
  toString: () => string
}

interface HorizonWithUndocumentedProps extends Server {
  serverURL: URI
}

const MAX_INT64 = "9223372036854775807"

const dedupe = <T>(array: T[]) => Array.from(new Set(array))

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

// Hacky fix for the breaking change recently introduced to the horizon's account endpoint
export function getSignerKey(signer: Horizon.AccountSigner | { key: string; weight: number }) {
  return "key" in signer ? signer.key : signer.public_key
}

async function fetchFeeStats(horizon: Server): Promise<FeeStats> {
  const url = joinURL(getHorizonURL(horizon), "/fee_stats")
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Request to ${url} failed with status code ${response.status}`)
  }
  return response.json()
}

export async function selectSmartTransactionFee(horizon: Server, preset: SmartFeePreset): Promise<number> {
  const feeStats = await fetchFeeStats(horizon)
  const capacityUsage = Number.parseFloat(feeStats.ledger_capacity_usage)
  const percentileFees = (feeStats as any) as { [key: string]: string }

  const smartFee =
    capacityUsage > preset.capacityTrigger
      ? Number.parseInt(percentileFees[`p${preset.percentile}_accepted_fee`] || feeStats.mode_accepted_fee, 10)
      : Number.parseInt(feeStats.min_accepted_fee, 10)

  return Math.min(smartFee, preset.maxFee)
}

export async function friendbotTopup(horizon: Server, publicKey: string) {
  const horizonMetadata = await (await fetch(getHorizonURL(horizon))).json()
  const friendBotHref = horizonMetadata._links.friendbot.href.replace(/\{\?.*/, "")

  const response = await fetch(friendBotHref + `?addr=${publicKey}`)
  return response.json()
}

export function getAccountMinimumBalance(
  accountData: Pick<Horizon.AccountResponse, "balances" | "data" | "signers">,
  openOfferCount: number = 0
) {
  // FIXME: Needs to be queried from horizon
  const baseReserve = BigNumber(0.5)

  const trustlineCount = accountData.balances.filter(balance => balance.asset_type !== "native").length

  return BigNumber(1)
    .add(accountData.signers.length)
    .add(Object.keys(accountData.data).length)
    .add(openOfferCount)
    .add(trustlineCount)
    .mul(baseReserve)
}

export function getMatchingAccountBalance(balances: Horizon.BalanceLine[], assetCode: string) {
  const matchingBalanceLine = balances.find(balance => {
    return balance.asset_type === "native" ? assetCode === "XLM" : balance.asset_code === assetCode
  })
  return matchingBalanceLine ? BigNumber(matchingBalanceLine.balance) : BigNumber(0)
}

export function getHorizonURL(horizon: Server) {
  return (horizon as HorizonWithUndocumentedProps).serverURL.toString()
}

export function isSignedByAnyOf(signature: xdr.DecoratedSignature, publicKeys: string[]) {
  return publicKeys.some(publicKey => signatureMatchesPublicKey(signature, publicKey))
}

export function signatureMatchesPublicKey(signature: xdr.DecoratedSignature, publicKey: string): boolean {
  const hint = (signature as SignatureWithHint).hint()
  const keypair = Keypair.fromPublicKey(publicKey)

  return hint.equals(keypair.signatureHint() as Buffer)
}

export function trustlineLimitEqualsUnlimited(limit: string | number) {
  return String(limit).replace(".", "") === MAX_INT64
}
