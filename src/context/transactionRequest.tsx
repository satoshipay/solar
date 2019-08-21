import React from "react"
import { StellarUri, StellarUriType } from "@stellarguard/stellar-uri"
import { verifyTransactionRequest } from "../lib/stellar-uri"
import { subscribeToDeepLinkURLs } from "../platform/protocol-handler"
import { trackError } from "./notifications"
import { SolarUri, SolarUriType } from "../lib/solar-uri"

const allowUnsafeTestnetURIs = Boolean(process.env.ALLOW_UNSAFE_TESTNET_URIS)

interface Props {
  children: React.ReactNode
}

interface ContextType {
  uri: StellarUri | SolarUri | null
  clearURI: () => void
}

const initialValues: ContextType = {
  uri: null,
  clearURI: () => undefined
}

const TransactionRequestContext = React.createContext<ContextType>(initialValues)

export function TransactionRequestProvider(props: Props) {
  const [uri, setURI] = React.useState<StellarUri | SolarUri | null>(null)

  const clearURI = React.useCallback(() => setURI(null), [])

  const verifyStellarURI = React.useCallback(async (incomingURI: string) => {
    try {
      const parsedURI = await verifyTransactionRequest(incomingURI, { allowUnsafeTestnetURIs })
      setURI(parsedURI)
    } catch (error) {
      trackError(error)
    }
  }, [])

  const verifySolarURI = (incomingURI: string) => {
    const solarUri = new SolarUri(incomingURI)
    setURI(solarUri)
  }

  React.useEffect(() => {
    const unsubscribe = subscribeToDeepLinkURLs(async incomingURI => {
      const url = new URL(incomingURI)
      switch (url.pathname) {
        case StellarUriType.Transaction || StellarUriType.Pay:
          verifyStellarURI(incomingURI)
          break
        case SolarUriType.Import:
          verifySolarURI(incomingURI)
          break
        default:
          trackError(new Error(`Incoming uri ${incomingURI} does not match any expected type.`))
          break
      }
    })
    return unsubscribe
  }, [])

  return (
    <TransactionRequestContext.Provider value={{ uri, clearURI }}>{props.children}</TransactionRequestContext.Provider>
  )
}

export { ContextType as TransactionRequestContextType, TransactionRequestContext }
