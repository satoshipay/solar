import { Observable, Subject } from "observable-fns"
import qs from "qs"
import { Networks, Transaction } from "stellar-sdk"
import { CustomError } from "~Generic/lib/errors"
import {
  createSignatureRequestURI,
  MultisigServerInfo,
  MultisigTransactionResponse
} from "~Generic/lib/multisig-service"
import { manageStreamConnection, whenBackOnline } from "~Generic/lib/stream"
import { joinURL } from "~Generic/lib/url"
import { raiseConnectionError, ServiceID } from "./errors"
import { getNetwork } from "./stellar-network"

interface ServerSentEvent {
  data: string | string[]
  event?: string
  id?: string
  retry?: number
}

interface NewSignatureRequest {
  type: "transaction:added"
  transaction: MultisigTransactionResponse
}

interface SignatureRequestUpdate {
  type: "transaction:updated"
  transaction: MultisigTransactionResponse
}

type SignatureRequestEvent = NewSignatureRequest | SignatureRequestUpdate

const returnedMultisigTxUpdates = new Subject<SignatureRequestUpdate>()

const dedupe = <T>(array: T[]) => Array.from(new Set(array))
const toArray = <T>(thing: T | T[]) => (Array.isArray(thing) ? thing : [thing])

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

export async function fetchServerInfo(serviceURL: string) {
  const url = joinURL(serviceURL, "/capabilities")
  const response = await fetch(url)

  if (!response.ok) {
    const responseText = await response.text()
    throw CustomError("HttpRequestError", `HTTP fetch failed: ${responseText} \nService: ${serviceURL}`, {
      response: responseText,
      service: serviceURL
    })
  }

  return (await response.json()) as MultisigServerInfo
}

export async function fetchTransactions(serviceURL: string, accountIDs: string[]) {
  const url = joinURL(serviceURL, `/accounts/${dedupe(accountIDs).join(",")}/transactions`)
  const response = await fetch(url)

  if (!response.ok) {
    const responseText = await response.text()
    throw CustomError(
      "FetchSignatureRequestsError",
      `Fetching signature requests failed: ${responseText} \nService: ${serviceURL}`,
      {
        response: responseText,
        service: serviceURL
      }
    )
  }

  return (await response.json()) as MultisigTransactionResponse[]
}

export function subscribeToTransactions(serviceURL: string, accountIDs: string[]) {
  if (accountIDs.length === 0) {
    return new Observable<SignatureRequestEvent>(() => undefined)
  }

  const url = joinURL(serviceURL, `/accounts/${dedupe(accountIDs).join(",")}/transactions`)

  return new Observable<SignatureRequestEvent>(observer => {
    let eventSource: EventSource
    let lastErrorTime = 0
    let unsubscribe: () => void

    const init = () => {
      unsubscribe = manageStreamConnection(() => {
        eventSource = new EventSource(url)
        return () => eventSource.close()
      })

      eventSource.addEventListener(
        "transaction:added",
        ((message: ServerSentEvent) => {
          for (const transaction of toArray(message.data).map(data => JSON.parse(data))) {
            observer.next({
              type: "transaction:added",
              transaction
            })
          }
        }) as any,
        false
      )

      eventSource.addEventListener(
        "transaction:updated",
        ((message: ServerSentEvent) => {
          for (const transaction of toArray(message.data).map(data => JSON.parse(data))) {
            observer.next({
              type: "transaction:updated",
              transaction
            })
          }
        }) as any,
        false
      )

      const clearOnError = () => {
        eventSource.onerror = () => undefined
      }

      eventSource.onerror = () => {
        if (Date.now() - lastErrorTime > 10000) {
          // tslint:disable-next-line no-console
          console.error(Error("Multisig service event stream crashed."))
        }
        if (navigator.onLine !== false && Date.now() - lastErrorTime < 3000) {
          // double trouble
          raiseConnectionError(
            CustomError(
              "MultiSigEventStreamDoubleErroredError",
              `Multi-signature update event stream double-errored: ${url}`,
              { url }
            ),
            ServiceID.MultiSignature
          )
        }
        lastErrorTime = Date.now()

        if (navigator.onLine === false) {
          clearOnError()
          unsubscribe()
          whenBackOnline(() => init())
        } else if (eventSource.readyState === eventSource.CLOSED) {
          clearOnError()
          setTimeout(() => init(), 500)
        }
      }
    }

    returnedMultisigTxUpdates.subscribe(observer)
    init()

    return () => eventSource.close()
  })
}

export async function shareTransaction(
  serviceURL: string,
  publicKey: string,
  testnet: boolean,
  transactionXdr: string,
  signatureXdr: string
) {
  const transaction = new Transaction(transactionXdr, getNetwork(testnet))
  const url = joinURL(serviceURL, "/transactions")

  const req = createSignatureRequestURI(transaction, {
    network_passphrase: testnet ? Networks.TESTNET : undefined
  })

  const response = await fetch(url, {
    body: JSON.stringify({
      pubkey: publicKey,
      req,
      signature: signatureXdr
    }),
    headers: {
      "Content-Type": "application/json"
    },
    method: "POST"
  })

  const contentType = response.headers.get("Content-Type")
  const responseData = contentType?.startsWith("application/json") ? await response.json() : await response.text()

  if (!response.ok) {
    await handleServerError(response, responseData)
  }

  return responseData
}

export async function submitSignature(multisigTx: MultisigTransactionResponse, signedTxXdr: string) {
  const collateEndpointURL = parseRequestURI(multisigTx.req).parameters.callback.replace(/^url:/, "")

  if (!collateEndpointURL) {
    throw CustomError(
      "NoCallbackUrlError",
      "Cannot submit back to multi-signature service. Signature request has no callback URL set."
    )
  }

  const response = await fetch(collateEndpointURL, {
    method: "POST",
    body: qs.stringify({
      xdr: signedTxXdr
    }),
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    }
  })

  const contentType = response.headers.get("Content-Type")
  const responseData = contentType?.startsWith("application/json") ? await response.json() : await response.text()

  if (response.ok) {
    returnedMultisigTxUpdates.next({
      type: "transaction:updated",
      transaction: responseData
    })
  } else {
    await handleServerError(response, responseData)
  }

  if (responseData.status === "ready") {
    // Transaction is now sufficiently signed to be submitted to the Stellar network
    const txSubmissionResponse = await submitMultisigTransactionToStellarNetwork(multisigTx)

    return {
      ...txSubmissionResponse,
      submittedToStellarNetwork: true
    }
  } else {
    return {
      data: responseData,
      status: response.status,
      submittedToStellarNetwork: false
    }
  }
}

export async function submitMultisigTransactionToStellarNetwork(multisigTx: MultisigTransactionResponse) {
  const collateEndpointURL = parseRequestURI(multisigTx.req).parameters.callback.replace(/^url:/, "")
  const submissionEndpointURL = collateEndpointURL.replace(
    `/transactions/${multisigTx.hash}/signatures`,
    `/transactions/${multisigTx.hash}/submit`
  )

  const response = await fetch(submissionEndpointURL, {
    method: "POST"
  })

  const contentType = response.headers.get("Content-Type")
  const responseData = contentType?.startsWith("application/json") ? await response.json() : await response.text()

  if (!response.ok) {
    await handleServerError(response, responseData)
  }

  return {
    status: response.status,
    data: responseData
  }
}

async function handleServerError(response: Response, responseBodyObject: any) {
  const horizonResponse =
    responseBodyObject && responseBodyObject.type === "https://stellar.org/horizon-errors/transaction_failed"
      ? responseBodyObject
      : null

  const message =
    typeof responseBodyObject === "string"
      ? responseBodyObject
      : responseBodyObject.detail || responseBodyObject.message || responseBodyObject.error

  if (horizonResponse) {
    // Throw something that can be handled by explainSubmissionError()
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
    throw CustomError(
      "SubmissionFailedError",
      `Submitting transaction to multi-signature service failed  ${response.status}: ${message}`,
      {
        endpoint: "multi-signature service",
        message,
        status: String(response.status)
      }
    )
  }
}
