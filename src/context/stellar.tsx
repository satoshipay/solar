import React from "react"
import { workers } from "../worker-controller"
import { trackError } from "./notifications"

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

    const init = async () => {
      const { netWorker } = await workers

      const [horizonLivenetURL, horizonTestnetURL] = await Promise.all([
        netWorker.checkHorizonOrFailover("https://stellar-horizon.satoshipay.io/", "https://horizon.stellar.org"),
        netWorker.checkHorizonOrFailover(
          "https://stellar-horizon-testnet.satoshipay.io/",
          "https://horizon-testnet.stellar.org"
        )
      ])

      if (!cancelled) {
        setContextValue(prevValues => ({
          horizonLivenetURL:
            horizonLivenetURL !== prevValues.horizonLivenetURL ? horizonLivenetURL : prevValues.horizonLivenetURL,
          horizonTestnetURL:
            horizonTestnetURL !== prevValues.horizonTestnetURL ? horizonTestnetURL : prevValues.horizonTestnetURL
        }))

        if (
          horizonLivenetURL !== initialValues.horizonLivenetURL ||
          horizonTestnetURL !== initialValues.horizonTestnetURL
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
