import React from "react"

export function useDebouncedState<T>(initial: T, delay: number = 50): [T, (update: T | ((prev: T) => T)) => void] {
  const currentCallGroupTimeoutRef = React.useRef<any>(undefined)
  const updateQueueRef = React.useRef<Array<T | ((prev: T) => T)> | undefined>(undefined)
  const [state, setState] = React.useState(initial)

  const applyUpdateQueue = (previous: T, queue: Array<T | ((prev: T) => T)>) => {
    return queue.reduce<T>(
      (intermediate, queuedUpdate) =>
        typeof queuedUpdate === "function" ? (queuedUpdate as ((p: T) => T))(intermediate) : queuedUpdate,
      previous
    )
  }

  const debouncedSetState = React.useCallback((update: T | ((prev: T) => T)) => {
    if (currentCallGroupTimeoutRef.current) {
      updateQueueRef.current!.push(update)
    } else {
      currentCallGroupTimeoutRef.current = setTimeout(() => {
        if (updateQueueRef.current) {
          const queue = updateQueueRef.current
          setState(prev => applyUpdateQueue(prev, queue))
        }
        currentCallGroupTimeoutRef.current = undefined
        updateQueueRef.current = undefined
      }, delay)
      updateQueueRef.current = []
      setState(update)
    }
  }, [])

  React.useEffect(() => {
    const onUnmount = () => {
      if (currentCallGroupTimeoutRef.current) {
        clearTimeout(currentCallGroupTimeoutRef.current)
      }
    }
    return onUnmount
  }, [])

  return [state, debouncedSetState]
}

export function useOnlineStatus() {
  const [isOnline, setOnlineStatus] = React.useState(window.navigator.onLine)
  const setOffline = () => setOnlineStatus(false)
  const setOnline = () => setOnlineStatus(true)

  React.useEffect(() => {
    window.addEventListener("offline", setOffline)
    window.addEventListener("online", setOnline)
  }, [])

  return {
    isOnline
  }
}
