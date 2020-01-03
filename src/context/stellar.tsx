import React from "react"
import { useNetworkCacheReset } from "../hooks/stellar-subscriptions"
import { workers } from "../worker-controller"
import { trackError } from "./notifications"

interface Props {
  children: React.ReactNode
}

interface ContextType {
  isSelectionPending: boolean
  pendingSelection: Promise<any>
  pubnetHorizonURL: string
  testnetHorizonURL: string
}

const initialValues: ContextType = {
  isSelectionPending: true,
  pendingSelection: Promise.reject("Horizon selection has not yet started"),
  pubnetHorizonURL: "https://stellar-horizon.satoshipay.io/",
  testnetHorizonURL: "https://stellar-horizon-testnet.satoshipay.io/"
}

const StellarContext = React.createContext<ContextType>(initialValues)

export function StellarProvider(props: Props) {
  const [contextValue, setContextValue] = React.useState<ContextType>(initialValues)
  const resetNetworkCaches = useNetworkCacheReset()

  React.useEffect(() => {
    let cancelled = false

    const init = async () => {
      const { netWorker } = await workers

      const horizonSelection = Promise.all([
        netWorker.checkHorizonOrFailover("https://stellar-horizon.satoshipay.io/", "https://horizon.stellar.org"),
        netWorker.checkHorizonOrFailover(
          "https://stellar-horizon-testnet.satoshipay.io/",
          "https://horizon-testnet.stellar.org"
        )
      ])

      setContextValue(prevState => ({ ...prevState, pendingSelection: horizonSelection }))
      const [pubnetHorizonURL, testnetHorizonURL] = await horizonSelection

      if (!cancelled) {
        setContextValue(prevState => ({
          isSelectionPending: false,
          pendingSelection: prevState.pendingSelection,
          pubnetHorizonURL:
            pubnetHorizonURL !== prevState.pubnetHorizonURL ? pubnetHorizonURL : prevState.pubnetHorizonURL,
          testnetHorizonURL:
            testnetHorizonURL !== prevState.testnetHorizonURL ? testnetHorizonURL : prevState.testnetHorizonURL
        }))

        if (
          pubnetHorizonURL !== initialValues.pubnetHorizonURL ||
          testnetHorizonURL !== initialValues.testnetHorizonURL
        ) {
          await netWorker.resetAllSubscriptions()
          resetNetworkCaches()
        }

        // tslint:disable-next-line no-console
        console.debug(`Selected horizon servers:`, { pubnetHorizonURL, testnetHorizonURL })
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
