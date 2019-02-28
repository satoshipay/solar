import { xdr, Horizon, Keypair, Server, Transaction } from "stellar-sdk"

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
  return ((signer as any).key as string) || signer.public_key
}

export async function friendbotTopup(horizon: Server, publicKey: string) {
  const horizonMetadata = await (await fetch(getHorizonURL(horizon))).json()
  const friendBotHref = horizonMetadata._links.friendbot.href.replace(/\{\?.*/, "")

  const response = await fetch(friendBotHref + `?addr=${publicKey}`)
  return response.json()
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
