import React from "react"
import { trackError } from "../../context/notifications"

export function usePolling(pollIntervalMs: number) {
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null)

  const start = (callback: () => any) => {
    if (!intervalRef.current) {
      intervalRef.current = setInterval(async () => {
        try {
          await callback()
        } catch (error) {
          trackError(error)
        }
      }, pollIntervalMs) as any
    }
  }

  const stop = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
  }

  React.useEffect(() => {
    // Don't automatically start polling on mount, but definitely stop polling on unmount
    return () => stop()
  }, [])

  return {
    start,
    stop
  }
}
