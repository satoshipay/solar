import React from "react"
import { StellarUri, StellarUriType, TransactionStellarUri } from "@stellarguard/stellar-uri"
import { CustomError } from "~Generic/lib/errors"
import { subscribeToDeepLinkURLs } from "~Platform/protocol-handler"
import { verifyTransactionRequest } from "~Transaction/lib/stellar-uri"
import { trackError } from "./notifications"

const allowUnsafeTestnetURIs = Boolean(process.env.ALLOW_UNSAFE_TESTNET_URIS)

interface Props {
  children: React.ReactNode
}

interface ContextType {
  uri: StellarUri | null
  clearURI: () => void
}

const initialValues: ContextType = {
  uri: null,
  clearURI: () => undefined
}

const TransactionRequestContext = React.createContext<ContextType>(initialValues)

export function TransactionRequestProvider(props: Props) {
  const [uri, setURI] = React.useState<StellarUri | null>(null)

  const clearURI = React.useCallback(() => setURI(null), [])

  const verifyStellarURI = React.useCallback(async (incomingURI: string) => {
    try {
      const parsedURI = await verifyTransactionRequest(incomingURI, { allowUnsafeTestnetURIs })

      if (parsedURI.operation === StellarUriType.Transaction) {
        // check if contained transaction is valid
        const txURI = parsedURI as TransactionStellarUri
        txURI.getTransaction()
      }

      setURI(parsedURI)
    } catch (error) {
      trackError(error)
    }
  }, [])

  React.useEffect(() => {
    const unsubscribe = subscribeToDeepLinkURLs(async incomingURI => {
      const url = new URL(incomingURI)
      switch (url.pathname) {
        case StellarUriType.Transaction:
        case StellarUriType.Pay:
          verifyStellarURI(incomingURI)
          break
        default:
          trackError(
            CustomError(
              "UnexpectedStellarUriTypeError",
              `Incoming uri ${incomingURI} does not match any expected type.`,
              { incomingURI }
            )
          )
          break
      }
    })
    return unsubscribe
  }, [verifyStellarURI])

  return (
    <TransactionRequestContext.Provider value={{ uri, clearURI }}>{props.children}</TransactionRequestContext.Provider>
  )
}

export { ContextType as TransactionRequestContextType, TransactionRequestContext }
