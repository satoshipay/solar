import fetch from "isomorphic-fetch"
import qs from "qs"
import { Transaction, Networks } from "stellar-sdk"
import { CustomError } from "./errors"
import { signatureMatchesPublicKey } from "./stellar"
import { joinURL } from "./url"

type Omit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>

export interface ServerSentEvent {
  data: string | string[]
  event?: string
  id?: string
  retry?: number
}

export interface SignatureRequestSigner {
  account_id: string
  has_signed: boolean
}

export interface SignatureRequest {
  hash: string
  request_uri: string
  created_at: string
  updated_at: string
  completed_at: string

  // Parsed request URI
  meta: {
    callbackURL: string
    operation: string
    transaction: Transaction
  }

  _embedded: {
    signers: SignatureRequestSigner[]
  }
}

export interface TxParameters {
  callback?: string
  pubkey?: string
  msg?: string
  network_passphrase?: string
  origin_domain?: string
  signature?: string
}

function parseRequestURI(requestURI: string) {
  if (!requestURI.startsWith("web+stellar:")) {
    throw CustomError("WrongRequestStartError", "Expected request to start with 'web+stellar:'")
  }

  const [operation, queryString] = requestURI.replace(/^web\+stellar:/, "").split("?", 2)
  const parameters = qs.parse(queryString)

  return {
    operation,
    parameters
  }
}

export function deserializeSignatureRequest(rawSignatureRequest: Omit<SignatureRequest, "meta">): SignatureRequest {
  const { operation, parameters } = parseRequestURI(rawSignatureRequest.request_uri)
  const networkPassphrase = parameters.network_passphrase ? parameters.network_passphrase : Networks.PUBLIC

  return {
    ...rawSignatureRequest,
    meta: {
      operation,
      callbackURL: parameters.callback ? parameters.callback.replace(/^url:/, "") : undefined,
      transaction: new Transaction(parameters.xdr, networkPassphrase)
    }
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

export async function submitNewSignatureRequest(serviceURL: string, signatureRequestURI: string) {
  const submissionEndpoint = joinURL(serviceURL, "/submit")

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

    const message =
      responseBodyObject && responseBodyObject.message ? responseBodyObject.message : await response.text()
    throw CustomError(
      "SubmissionFailedError",
      `Submitting transaction to multi-signature service failed with status ${response.status}: ${message}`,
      {
        endpoint: "multi-signature service",
        message,
        status: String(response.status)
      }
    )
  }

  return response
}

export async function collateSignature(signatureRequest: SignatureRequest, signedTx: Transaction) {
  const collateEndpointURL = signatureRequest.meta.callbackURL

  if (!collateEndpointURL) {
    throw CustomError(
      "NoCallbackUrlError",
      "Cannot submit back to multi-signature service. Signature request has no callback URL set."
    )
  }

  const response = await fetch(collateEndpointURL, {
    method: "POST",
    body: qs.stringify({
      xdr: signedTx
        .toEnvelope()
        .toXDR()
        .toString("base64")
    }),
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    }
  })

  if (!response.ok) {
    const contentType = response.headers.get("Content-Type")
    const responseBodyObject = contentType && contentType.startsWith("application/json") ? await response.json() : null

    const horizonResponse = responseBodyObject && responseBodyObject.data ? responseBodyObject.data.response : null

    if (horizonResponse && horizonResponse.type === "https://stellar.org/horizon-errors/transaction_failed") {
      // Throw something that can be handled by explainSubmissionError()

      const message =
        responseBodyObject && responseBodyObject.message ? responseBodyObject.message : await response.text()
      throw Object.assign(
        CustomError(
          "SubmissionFailedError",
          `Submitting transaction to multi-signature service failed with status ${response.status}: ${message}`,
          {
            endpoint: "multi-signature service",
            message,
            status: String(response.status)
          }
        ),
        {
          response: {
            status: horizonResponse.status,
            data: horizonResponse
          }
        }
      )
    } else {
      const message =
        responseBodyObject && responseBodyObject.message ? responseBodyObject.message : await response.text()
      throw CustomError(
        "SubmissionFailedError",
        `Submitting transaction to multi-signature service failed with status ${response.status}: ${message}`,
        {
          endpoint: "multi-signature service",
          message,
          status: String(response.status)
        }
      )
    }
  }

  return response
}

export function isSignedByOneOf(transaction: Transaction, localPublicKeys: string[]) {
  return localPublicKeys.some(publicKey =>
    transaction.signatures.some(signature => signatureMatchesPublicKey(signature, publicKey))
  )
}
