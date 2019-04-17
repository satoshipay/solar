import fetch from "isomorphic-fetch"
import React from "react"
import { trackError } from "./notifications"
import { resetAllSubscriptions } from "../subscriptions"

interface Props {
  children: React.ReactNode
}

interface ContextType {
  horizonLivenetURL: string
  horizonTestnetURL: string
}

const initialValues: ContextType = {
  horizonLivenetURL: "https://stellar-horizon.satoshipay.io/",
  horizonTestnetURL: "https://stellar-horizon-testnet.satoshipay.io/"
}

const StellarContext = React.createContext<ContextType>(initialValues)

export function StellarProvider(props: Props) {
  const [contextValue, setContextValue] = React.useState<ContextType>(initialValues)

  React.useEffect(() => {
    let cancelled = false

    const checkHorizonOrFailover = async (primaryHorizonURL: string, secondaryHorizonURL: string) => {
      try {
        const primaryResponse = await fetch(primaryHorizonURL)
        if (primaryResponse.ok) {
          return primaryHorizonURL
        }
      } catch (error) {
        // tslint:disable-next-line
        console.error(error)
      }

      const secondaryResponse = await fetch(secondaryHorizonURL)
      return secondaryResponse.ok ? secondaryHorizonURL : primaryHorizonURL
    }

    const init = async () => {
      const [horizonLivenetURL, horizonTestnetURL] = await Promise.all([
        checkHorizonOrFailover("https://stellar-horizon.satoshipay.io/", "https://horizon.stellar.org"),
        checkHorizonOrFailover("https://stellar-horizon-testnet.satoshipay.io/", "https://horizon-testnet.stellar.org")
      ])

      if (!cancelled) {
        setContextValue({
          horizonLivenetURL,
          horizonTestnetURL
        })

        if (
          horizonLivenetURL !== initialValues.horizonLivenetURL ||
          horizonTestnetURL !== initialValues.horizonTestnetURL
        ) {
          resetAllSubscriptions()
        }

        // tslint:disable-next-line no-console
        console.debug(`Selected horizon servers:`, { horizonLivenetURL, horizonTestnetURL })
      }
    }

    if (navigator.onLine !== false) {
      init().catch(trackError)
    }

    const unsubscribe = () => {
      cancelled = true
    }
    return unsubscribe
  }, [])

  return <StellarContext.Provider value={contextValue}>{props.children}</StellarContext.Provider>
}

export { ContextType as StellarContextType, StellarContext }
