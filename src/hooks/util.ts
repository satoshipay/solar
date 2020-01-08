import React from "react"

export function useDebouncedState<T>(
  initial: T | (() => T),
  delay: number = 50
): [T, (update: T | ((prev: T) => T)) => void] {
  const currentCallGroupTimeoutRef = React.useRef<any>(undefined)
  const updateQueueRef = React.useRef<Array<T | ((prev: T) => T)> | undefined>(undefined)
  const [state, setState] = React.useState(initial)

  const debouncedSetState = React.useCallback((update: T | ((prev: T) => T)) => {
    const applyUpdateQueue = (previous: T, queue: Array<T | ((prev: T) => T)>) => {
      return queue.reduce<T>(
        (intermediate, queuedUpdate) =>
          typeof queuedUpdate === "function" ? (queuedUpdate as ((p: T) => T))(intermediate) : queuedUpdate,
        previous
      )
    }

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

export function useDeferredState<T>(initial: T, delay: number) {
  const [deferredState, setDeferredState] = React.useState<T>(initial)
  const [state, setState] = React.useState<T>(initial)

  const setDeferred = React.useCallback((update: React.SetStateAction<T>) => {
    setState(update)
    setTimeout(() => setDeferredState(update), delay)
  }, [])

  return [deferredState, state, setDeferred] as const
}

export function useForceRerender() {
  const [, setCounter] = React.useState(0)
  const forceRerender = () => setCounter(counter => counter++)
  return forceRerender
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

/**
 * Does the same as React.useMemo(), just reliably. The React docs state that you
 * should prepare for useMemo() to forget values once in a while in future React
 * versions.
 *
 * Use this hook to set a value once and return it in consecutive renderings.
 */
export function useSingleton<T>(init: () => T): T {
  const isInitializedRef = React.useRef(false)
  const valueRef = React.useRef<T | undefined>()

  if (!isInitializedRef.current) {
    valueRef.current = init()
    isInitializedRef.current = true
  }

  return valueRef.current!
}
