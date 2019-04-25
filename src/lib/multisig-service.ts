import fetch from "isomorphic-fetch"
import qs from "qs"
import { Transaction } from "stellar-sdk"
import { trackError } from "../context/notifications"
import { signatureMatchesPublicKey } from "./stellar"

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

const dedupe = <T>(array: T[]) => Array.from(new Set(array))

function urlJoin(baseURL: string, path: string) {
  if (baseURL.charAt(baseURL.length - 1) === "/" && path.charAt(0) === "/") {
    return baseURL + path.substr(1)
  } else if (baseURL.charAt(baseURL.length - 1) === "/" || path.charAt(0) === "/") {
    return baseURL + path
  } else {
    return baseURL + "/" + path
  }
}

function parseRequestURI(requestURI: string) {
  if (!requestURI.startsWith("web+stellar:")) {
    throw new Error("Expected request to start with 'web+stellar:'")
  }

  const [operation, queryString] = requestURI.replace(/^web\+stellar:/, "").split("?", 2)
  const parameters = qs.parse(queryString)

  return {
    operation,
    parameters
  }
}

function deserializeSignatureRequest(rawSignatureRequest: Omit<SignatureRequest, "meta">): SignatureRequest {
  const { operation, parameters } = parseRequestURI(rawSignatureRequest.request_uri)

  return {
    ...rawSignatureRequest,
    meta: {
      operation,
      callbackURL: parameters.callback ? parameters.callback.replace(/^url:/, "") : undefined,
      transaction: new Transaction(parameters.xdr)
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

export async function collateSignature(signatureRequest: SignatureRequest, signedTx: Transaction) {
  const collateEndpointURL = signatureRequest.meta.callbackURL

  if (!collateEndpointURL) {
    throw new Error("Cannot submit back to multi-signature service. Signature request has no callback URL set.")
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
          `Submitting transaction to multi-signature service failed with status ${response.status}: ${
            responseBodyObject.message
          }`
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
        `Submitting transaction to multi-signature service failed with status ${response.status}: ` +
          (responseBodyObject && responseBodyObject.message ? responseBodyObject.message : await response.text())
      )
    }
  }

  return response
}

export async function fetchSignatureRequests(serviceURL: string, accountIDs: string[]) {
  const url = urlJoin(serviceURL, `/requests/${dedupe(accountIDs).join(",")}`)
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Fetching signature requests failed: ${await response.text()}\nService: ${serviceURL}`)
  }

  return ((await response.json()) as any[]).map(deserializeSignatureRequest)
}

function deserializeSignatureRequestData(messageData: string | string[]) {
  const jsonResponses = Array.isArray(messageData) ? messageData : [messageData]
  const signatureRequests = jsonResponses.map(jsonResponse => deserializeSignatureRequest(JSON.parse(jsonResponse)))
  return signatureRequests
}

interface SubscriptionHandlers {
  onNewSignatureRequest?: (signatureRequest: SignatureRequest) => void
  onSignatureRequestUpdate?: (signatureRequest: SignatureRequest) => void
  onSignatureRequestSubmitted?: (signatureRequest: SignatureRequest) => void
  onError?: (error: Error) => void
}

export function subscribeToSignatureRequests(serviceURL: string, accountIDs: string[], handlers: SubscriptionHandlers) {
  if (accountIDs.length === 0) {
    return () => undefined
  }

  const {
    onError = trackError,
    onNewSignatureRequest = (signatureRequest: SignatureRequest) => undefined,
    onSignatureRequestUpdate = (signatureRequest: SignatureRequest) => undefined,
    onSignatureRequestSubmitted = (signatureRequest: SignatureRequest) => undefined
  } = handlers

  const url = urlJoin(serviceURL, `/stream/${dedupe(accountIDs).join(",")}`)
  let eventSource: EventSource
  let lastErrorTime = 0

  const init = () => {
    eventSource = new EventSource(url)

    if (onNewSignatureRequest) {
      eventSource.addEventListener(
        "signature-request",
        ((message: ServerSentEvent) => {
          for (const signatureRequest of deserializeSignatureRequestData(message.data)) {
            onNewSignatureRequest(signatureRequest)
          }
        }) as any,
        false
      )
    }

    eventSource.addEventListener(
      "signature-request:updated",
      ((message: ServerSentEvent) => {
        for (const signatureRequest of deserializeSignatureRequestData(message.data)) {
          onSignatureRequestUpdate(signatureRequest)
        }
      }) as any,
      false
    )

    eventSource.addEventListener(
      "signature-request:submitted",
      ((message: ServerSentEvent) => {
        for (const signatureRequest of deserializeSignatureRequestData(message.data)) {
          onSignatureRequestSubmitted(signatureRequest)
        }
      }) as any,
      false
    )

    const clearOnError = () => {
      eventSource.onerror = () => undefined
    }

    eventSource.onerror = () => {
      if (Date.now() - lastErrorTime > 10000) {
        onError(new Error("Multisig service event stream crashed."))
      }
      lastErrorTime = Date.now()

      if (navigator.onLine === false) {
        clearOnError()
        eventSource.close()
        window.addEventListener("online", () => init(), { once: true, passive: false })
      } else if (eventSource.readyState === eventSource.CLOSED) {
        clearOnError()
        setTimeout(() => init(), 500)
      }
    }
  }

  init()

  return function unsubscribe() {
    eventSource.close()
  }
}

export function isSignedByOneOf(transaction: Transaction, localPublicKeys: string[]) {
  return localPublicKeys.some(publicKey =>
    transaction.signatures.some(signature => signatureMatchesPublicKey(signature, publicKey))
  )
}
