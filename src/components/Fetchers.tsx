import React from "react"
import Async from "react-promise"
import { LedgerRecord, Server } from "stellar-sdk"
import { getHorizonURL } from "../lib/stellar"
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

async function fetchHorizonMetadata(horizon: Server) {
  const response = await fetch(getHorizonURL(horizon))
  return response.json()
}

async function fetchLatestLedger(horizon: Server) {
  const horizonMeta = await fetchHorizonMetadata(horizon)
  const ledgerData = await (horizon.ledgers() as any).ledger(horizonMeta.history_latest_ledger).call()
  return ledgerData
}

type LedgerDataRenderProp = (ledgerData: LedgerRecord) => React.ReactNode

const LedgerMetadata = (props: { children: LedgerDataRenderProp; testnet: boolean }) => {
  return (
    <Horizon testnet={props.testnet}>
      {horizon => (
        <Memoized cacheKey={getHorizonURL(horizon)} fetch={() => fetchLatestLedger(horizon)} then={props.children} />
      )}
    </Horizon>
  )
}

export const MinimumAccountBalance = (props: { testnet: boolean }) => {
  return (
    <LedgerMetadata testnet={props.testnet}>
      {ledgerData => <>{(ledgerData.base_reserve_in_stroops / 1e7) * 2}</>}
    </LedgerMetadata>
  )
}
