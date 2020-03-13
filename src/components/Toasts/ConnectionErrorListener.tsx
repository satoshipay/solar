import React from "react"
import { NotificationsContext } from "../../context/notifications"
import { useNetWorker } from "../../hooks/workers"
import { ConnectionErrorEvent, Service } from "../../workers/net-worker"
import { autoHideDuration } from "./NotificationContainer"

type Setter<T> = (prev: T) => T

interface TimestampedError {
  error: ConnectionErrorEvent
  timestamp: number
}

const connectionErrorMessages: Record<Service, string> = {
  HorizonPublic: "Stellar connection issue",
  HorizonTestnet: "Stellar testnet connection issue",
  MultiSignature: "Multi-signature connection issue"
}

const connectionErrorPriorities: Record<Service, number> = {
  HorizonTestnet: 1,
  MultiSignature: 2,
  HorizonPublic: 3
}

const removeFromErrors = (error: TimestampedError) => (recentErrors: TimestampedError[]) => {
  return recentErrors.filter(someError => someError !== error)
}

function useRecentConnectionErrors() {
  // Cannot use `React.useState()`, since we need to async get the current array
  const recentConnectionErrorsRef = React.useRef<TimestampedError[]>([])

  const setRecentConnectionErrors = (setter: Setter<TimestampedError[]>) => {
    recentConnectionErrorsRef.current = setter(recentConnectionErrorsRef.current)
  }

  const trackConnectionError = React.useCallback((error: ConnectionErrorEvent) => {
    const timestampedError = { error, timestamp: Date.now() }
    setRecentConnectionErrors(recentErrors => [...recentErrors, timestampedError])

    setTimeout(() => setRecentConnectionErrors(removeFromErrors(timestampedError)), autoHideDuration)
  }, [])

  const beatsExistingErrors = (error: ConnectionErrorEvent) => {
    const errorPrio = connectionErrorPriorities[error.service]
    const recentConnectionErrors = recentConnectionErrorsRef.current

    return (
      recentConnectionErrors.length === 0 ||
      recentConnectionErrors.every(prevError => connectionErrorPriorities[prevError.error.service] <= errorPrio)
    )
  }

  return {
    beatsExisting: beatsExistingErrors,
    track: trackConnectionError
  }
}

function ConnectionErrorListener() {
  const Notifications = React.useContext(NotificationsContext)
  const netWorker = useNetWorker()
  const recentErrors = useRecentConnectionErrors()

  React.useEffect(() => {
    const subscription = netWorker
      .connectionErrors()
      .filter(recentErrors.beatsExisting)
      .subscribe(error => {
        Notifications.showConnectionError({
          message: connectionErrorMessages[error.service]
        })
        recentErrors.track(error)
      })
    return () => subscription.unsubscribe()
  }, [Notifications, netWorker, recentErrors])

  return null
}

export default React.memo(ConnectionErrorListener)
