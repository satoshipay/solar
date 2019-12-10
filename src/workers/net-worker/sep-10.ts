import { Networks, Server, Transaction } from "stellar-sdk"
import * as WebAuth from "@satoshipay/stellar-sep-10"

const JwtImport = import("jsonwebtoken")

export async function fetchWebAuthChallenge(endpointURL: string, serviceSigningKey: string, localPublicKey: string) {
  return WebAuth.fetchChallenge(endpointURL, serviceSigningKey, localPublicKey)
}

export async function fetchWebAuthData(horizonURL: string, issuerAccountID: string) {
  const horizon = new Server(horizonURL)
  return WebAuth.fetchWebAuthData(horizon, issuerAccountID)
}

export async function postWebAuthResponse(endpointURL: string, transactionXdrBase64: string, network: Networks) {
  const JWT = await JwtImport

  const transaction = new Transaction(transactionXdrBase64, network)
  const authToken = await WebAuth.postResponse(endpointURL, transaction)
  const decoded = JWT.decode(authToken) as any

  return {
    authToken,
    decoded
  }
}
