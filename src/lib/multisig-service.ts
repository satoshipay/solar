import { TFunction } from "i18next"
import fetch from "isomorphic-fetch"
import qs from "qs"
import { Transaction, Networks } from "stellar-sdk"
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

function parseRequestURI(requestURI: string, t: TFunction) {
  if (!requestURI.startsWith("web+stellar:")) {
    throw new Error(t("error.multi-sig.wrong-start"))
  }

  const [operation, queryString] = requestURI.replace(/^web\+stellar:/, "").split("?", 2)
  const parameters = qs.parse(queryString)

  return {
    operation,
    parameters
  }
}

export function deserializeSignatureRequest(
  rawSignatureRequest: Omit<SignatureRequest, "meta">,
  t: TFunction
): SignatureRequest {
  const { operation, parameters } = parseRequestURI(rawSignatureRequest.request_uri, t)
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

export async function submitNewSignatureRequest(serviceURL: string, signatureRequestURI: string, t: TFunction) {
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

    throw new Error(
      t("error.multi-sig.submission-failed", {
        status: response.status,
        message: responseBodyObject && responseBodyObject.message ? responseBodyObject.message : await response.text()
      })
    )
  }

  return response
}

export async function collateSignature(signatureRequest: SignatureRequest, signedTx: Transaction, t: TFunction) {
  const collateEndpointURL = signatureRequest.meta.callbackURL

  if (!collateEndpointURL) {
    throw new Error(t("error.multi-sig.no-callback-url"))
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
      throw Object.assign(
        new Error(
          t("error.multi-sig.submission-failed", {
            status: response.status,
            message: responseBodyObject.message
          })
        ),
        {
          response: {
            status: horizonResponse.status,
            data: horizonResponse
          }
        }
      )
    } else {
      throw new Error(
        t("error.multi-sig.submission-failed", {
          status: response.status,
          message: responseBodyObject && responseBodyObject.message ? responseBodyObject.message : await response.text()
        })
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
