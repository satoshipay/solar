import JWT from "jsonwebtoken"
import { Networks, Server, Transaction } from "stellar-sdk"
import * as WebAuth from "@satoshipay/stellar-sep-10"

export async function fetchWebAuthChallenge(
  endpointURL: string,
  serviceSigningKey: string | null,
  localPublicKey: string
) {
  const challenge = await WebAuth.fetchChallenge(endpointURL, serviceSigningKey, localPublicKey)
  return challenge
    .toEnvelope()
    .toXDR()
    .toString("base64")
}

export async function fetchWebAuthData(horizonURL: string, issuerAccountID: string) {
  const horizon = new Server(horizonURL)
  return WebAuth.fetchWebAuthData(horizon, issuerAccountID)
}

export async function postWebAuthResponse(endpointURL: string, transactionXdrBase64: string, network: Networks) {
  const transaction = new Transaction(transactionXdrBase64, network)
  const authToken = await WebAuth.postResponse(endpointURL, transaction)
  const decoded = JWT.decode(authToken) as any

  return {
    authToken,
    decoded
  }
}
