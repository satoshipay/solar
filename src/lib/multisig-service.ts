import fetch from "isomorphic-fetch"
import qs from "qs"
import { Transaction } from "stellar-sdk"

export interface TxParameters {
  callback?: string
  pubkey?: string
  msg?: string
  network_passphrase?: string
  origin_domain?: string
  signature?: string
}

function urlJoin(baseURL: string, path: string) {
  if (baseURL.charAt(baseURL.length - 1) === "/" && path.charAt(0) === "/") {
    return baseURL + path.substr(1)
  } else if (baseURL.charAt(baseURL.length - 1) === "/" || path.charAt(0) === "/") {
    return baseURL + path
  } else {
    return baseURL + "/" + path
  }
}

export function createSignatureRequestURI(transaction: Transaction, options: TxParameters) {
  const xdr = transaction
    .toEnvelope()
    .toXDR()
    .toString("base64")

  const query: { [paramName: string]: string | undefined } = {
    ...options,
    xdr
  }
  return "web+stellar:tx?" + qs.stringify(query)
}

export async function submitSignatureRequest(serviceURL: string, signatureRequestURI: string) {
  const submissionEndpoint = urlJoin(serviceURL, "/submit")

  const response = await fetch(submissionEndpoint, {
    method: "POST",
    body: signatureRequestURI,
    headers: {
      "Content-Type": "text/plain"
    }
  })

  if (!response.ok) {
    const contentType = response.headers.get("Content-Type")
    const responseBodyObject = contentType && contentType.startsWith("application/json") ? await response.json() : null

    throw new Error(
      `Submitting transaction to multi-signature service failed with status ${response.status}: ` +
        (responseBodyObject && responseBodyObject.message ? responseBodyObject.message : await response.text())
    )
  }

  return response
}
