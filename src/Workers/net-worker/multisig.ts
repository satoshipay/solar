import { Observable } from "observable-fns"
import { Networks, Transaction } from "stellar-sdk"
import { CustomError } from "~Generic/lib/errors"
import {
  createSignatureRequestURI,
  MultisigServerInfo,
  MultisigTransactionResponse,
  ServerSentEvent,
  SignatureRequest
} from "~Generic/lib/multisig-service"
import { manageStreamConnection, whenBackOnline } from "~Generic/lib/stream"
import { joinURL } from "~Generic/lib/url"
import { raiseConnectionError, ServiceID } from "./errors"

const dedupe = <T>(array: T[]) => Array.from(new Set(array))
const toArray = <T>(thing: T | T[]) => (Array.isArray(thing) ? thing : [thing])

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
  const url = joinURL(serviceURL, `/transactions/${dedupe(accountIDs).join(",")}`)
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

interface NewSignatureRequest {
  type: "transaction:added"
  transaction: SignatureRequest
}

interface SignatureRequestUpdate {
  type: "transaction:updated"
  transaction: SignatureRequest
}

type SignatureRequestEvent = NewSignatureRequest | SignatureRequestUpdate

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

    init()

    return () => eventSource.close()
  })
}

async function shareTransaction(
  serviceURL: string,
  accountID: string,
  testnet: boolean,
  transactionXdr: string,
  signatureXdr: string
) {
  const transaction = new Transaction(transactionXdr, testnet ? Networks.TESTNET : Networks.PUBLIC)
  const url = joinURL(serviceURL, "/transactions")

  const req = createSignatureRequestURI(transaction, {
    network_passphrase: testnet ? Networks.TESTNET : undefined
  })

  const response = await fetch(url, {
    body: JSON.stringify({
      pubkey: accountID,
      req,
      signature: signatureXdr
    }),
    headers: {
      "Content-Type": "application/json"
    },
    method: "POST"
  })

  if (!response.ok) {
    const responseText = await response.text()
    throw CustomError("HttpRequestError", `HTTP fetch failed: ${responseText} \nService: ${serviceURL}`, {
      response: responseText,
      service: serviceURL
    })
  }

  return response.json()
}
