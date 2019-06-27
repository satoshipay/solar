import React from "react"
import { TransactionStellarUri, PayStellarUri, parseStellarUri } from "@stellarguard/stellar-uri"
import { trackError } from "./notifications"

interface Props {
  children: React.ReactNode
}

interface ContextType {
  uri: TransactionStellarUri | PayStellarUri | null
  clearURI(): void
}

const initialValues: ContextType = {
  uri: null,
  clearURI: () => undefined
}

const TransactionRequestContext = React.createContext<ContextType>(initialValues)

export function TransactionRequestProvider(props: Props) {
  const [contextValue, setContextValue] = React.useState<ContextType>(initialValues)

  const clearURI = () => {
    setContextValue({ uri: null, ...contextValue })
  }

  const verify = async (request: string) => {
    try {
      const uri = parseStellarUri(request)

      const isVerified = await uri.verifySignature()
      if (isVerified) {
        setContextValue({ uri, clearURI })
      } else {
        trackError(new Error(`Verification of uri '${uri}'failed`))
      }
    } catch (error) {
      trackError(error)
    }
  }

  const subscribeToDeeplinkURLs = (callback: (url: string) => void) => {
    callback("test")
  }

  React.useEffect(() => {
    const unsubscribe = subscribeToDeeplinkURLs(url => {
      verify(url)
    })

    return unsubscribe
  }, [])

  return <TransactionRequestContext.Provider value={contextValue}>{props.children}</TransactionRequestContext.Provider>
}

export { ContextType as TransactionRequestContextType, TransactionRequestContext }
