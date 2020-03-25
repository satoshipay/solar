import React from "react"
import { Memo } from "stellar-sdk"
import { WithdrawalSuccessResponse } from "@satoshipay/stellar-transfer"
import { trackError } from "~App/contexts/notifications"

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
      intervalRef.current = null
    }
  }

  React.useEffect(() => {
    // Don't automatically start polling on mount, but definitely stop polling on unmount
    return () => stop()
  }, [])

  return {
    isActive: () => intervalRef.current !== null,
    start,
    stop
  }
}

export function createMemo(withdrawalResponse: WithdrawalSuccessResponse): Memo | null {
  const { memo, memo_type: type } = withdrawalResponse

  if (!memo || !type) {
    return null
  }

  switch (type) {
    case "hash":
      const hash = Buffer.from(memo, "base64")
      return Memo.hash(hash.toString("hex"))
    case "id":
      return Memo.id(memo)
    case "text":
      return Memo.text(memo)
    default:
      return null
  }
}

type ToNumber<T> = T extends null | undefined ? T : number

export function parseAmount<T extends string | number | null | undefined>(value: T): ToNumber<T> {
  const parsed = value === null || value === undefined ? value : Number.parseFloat(value as string)

  return parsed as ToNumber<T>
}
