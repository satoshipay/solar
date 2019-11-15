import fetch from "isomorphic-fetch"
import React from "react"
import { Server } from "stellar-sdk"
import { trackError } from "./notifications"

async function checkHorizonOrFailover(primaryHorizonURL: string, secondaryHorizonURL: string) {
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

interface Props {
  children: React.ReactNode
}

interface ContextType {
  horizonLivenet: Server
  horizonTestnet: Server
}

const initialValues: ContextType = {
  horizonLivenet: new Server("https://stellar-horizon.satoshipay.io/"),
  horizonTestnet: new Server("https://stellar-horizon-testnet.satoshipay.io/")
}

const StellarContext = React.createContext<ContextType>(initialValues)

export function StellarProvider(props: Props) {
  const [contextValue, setContextValue] = React.useState<ContextType>(initialValues)

  React.useEffect(() => {
    let cancelled = false

    const init = async () => {
      const [horizonLivenetURL, horizonTestnetURL] = await Promise.all([
        checkHorizonOrFailover("https://stellar-horizon.satoshipay.io/", "https://horizon.stellar.org"),
        checkHorizonOrFailover("https://stellar-horizon-testnet.satoshipay.io/", "https://horizon-testnet.stellar.org")
      ])

      if (!cancelled) {
        setContextValue(prevValues => ({
          horizonLivenet:
            horizonLivenetURL !== String(prevValues.horizonLivenet.serverURL)
              ? new Server(horizonLivenetURL)
              : prevValues.horizonLivenet,
          horizonTestnet:
            horizonTestnetURL !== String(prevValues.horizonTestnet.serverURL)
              ? new Server(horizonTestnetURL)
              : prevValues.horizonTestnet
        }))

        if (
          horizonLivenetURL !== String(initialValues.horizonLivenet.serverURL) ||
          horizonTestnetURL !== String(initialValues.horizonTestnet.serverURL)
        ) {
          // FIXME: resetAllSubscriptions()
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
