import { Server } from "stellar-sdk"

interface URI {
  toString: () => string
}

interface HorizonWithUndocumentedProps extends Server {
  serverURL: URI
}

const MAX_INT64 = "9223372036854775807"

export const networkPassphrases = {
  mainnet: "Public Global Stellar Network ; September 2015",
  testnet: "Test SDF Network ; September 2015"
}

export function getHorizonURL(horizon: Server) {
  return (horizon as HorizonWithUndocumentedProps).serverURL.toString()
}

export function trustlineLimitEqualsUnlimited(limit: string | number) {
  return String(limit).replace(".", "") === MAX_INT64
}

export async function friendbotTopup(horizon: Server, publicKey: string) {
  const horizonMetadata = await (await fetch(getHorizonURL(horizon))).json()
  const friendBotHref = horizonMetadata._links.friendbot.href.replace(/\{\?.*/, "")

  const response = await fetch(friendBotHref + `?addr=${publicKey}`)
  return response.json()
}
