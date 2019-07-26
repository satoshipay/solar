import React from "react"
import { StellarUri } from "@stellarguard/stellar-uri"
import { verifyTransactionRequest } from "../lib/stellar-uri"
import { subscribeToDeepLinkURLs } from "../platform/protocol-handler"
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

  React.useEffect(() => {
    const unsubscribe = subscribeToDeepLinkURLs(async incomingURI => {
      try {
        const parsedURI = await verifyTransactionRequest(incomingURI, { allowUnsafeTestnetURIs })
        setURI(parsedURI)
      } catch (error) {
        trackError(error)
      }
    })
    return unsubscribe
  }, [])

  return (
    <TransactionRequestContext.Provider value={{ uri, clearURI }}>{props.children}</TransactionRequestContext.Provider>
  )
}

export { ContextType as TransactionRequestContextType, TransactionRequestContext }
