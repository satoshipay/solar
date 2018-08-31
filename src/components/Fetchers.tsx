import React from "react"
import Async from "react-promise"
import { Horizon } from "./Subscribers"

const memCache = new Map<string, any>()
const memCacheCurrentlyFetching = new Map<string, boolean>()

async function memoize(cacheKey: string, fetching: Promise<any>) {
  memCacheCurrentlyFetching.set(cacheKey, true)
  try {
    const fetched = await fetching
    memCache.set(cacheKey, fetched)
    return fetched
  } finally {
    memCacheCurrentlyFetching.set(cacheKey, false)
  }
}

interface MemoizedProps<Value> {
  cacheKey: string
  pending?: React.ReactNode
  fetch: () => Promise<any>
  then: (resolved: Value) => React.ReactNode
  catch?: (rejection: Error) => React.ReactNode
}

const Memoized = <Value extends {}>(props: MemoizedProps<Value>) => {
  if (memCache.has(props.cacheKey)) {
    return <>{props.then(memCache.get(props.cacheKey))}</>
  } else if (memCacheCurrentlyFetching.get(props.cacheKey)) {
    return <>{props.pending}</>
  }

  return (
    <Async
      promise={memoize(props.cacheKey, props.fetch())}
      then={props.then}
      catch={props.catch}
      pending={props.pending}
    />
  )
}

export const AccountName = (props: { publicKey: string; testnet: boolean }) => {
  return (
    <Horizon testnet={props.testnet}>
      {horizon => (
        <Memoized
          cacheKey={`AccountData:${props.publicKey}`}
          fetch={() =>
            horizon
              .accounts()
              .accountId(props.publicKey)
              .call()
          }
          then={(accountData: any) => accountData.home_domain || props.publicKey}
          catch={() => props.publicKey}
          pending={props.publicKey}
        />
      )}
    </Horizon>
  )
}
