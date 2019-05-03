import { trackError } from "../context/notifications"
import { deserializeSignatureRequest, ServerSentEvent, SignatureRequest } from "../lib/multisig-service"
import { manageStreamConnection } from "../lib/stream"
import { joinURL } from "../lib/url"

const dedupe = <T>(array: T[]) => Array.from(new Set(array))

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

  const url = joinURL(serviceURL, `/stream/${dedupe(accountIDs).join(",")}`)
  let eventSource: EventSource
  let lastErrorTime = 0
  let unsubscribe: () => void

  const init = () => {
    unsubscribe = manageStreamConnection(() => {
      eventSource = new EventSource(url)
      return () => eventSource.close()
    })

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
        unsubscribe()
        window.addEventListener("online", () => init(), { once: true, passive: false })
      } else if (eventSource.readyState === eventSource.CLOSED) {
        clearOnError()
        setTimeout(() => init(), 500)
      }
    }
  }

  init()

  return () => eventSource.close()
}
