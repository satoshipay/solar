import React from "react"
import Async from "react-promise"
import { Server, ServerApi } from "stellar-sdk"
import { useHorizon } from "../hooks/stellar"
import { getHorizonURL } from "../lib/stellar"
import { Address } from "./PublicKey"

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

interface AccountNameProps {
  publicKey: string
  testnet: boolean
}

// tslint:disable-next-line no-shadowed-variable
export const AccountName = React.memo(function AccountName(props: AccountNameProps) {
  const horizon = useHorizon(props.testnet)
  const fallback = React.useMemo(() => <Address address={props.publicKey} variant="short" />, [props.publicKey])
  return (
    <Memoized
      cacheKey={`AccountData:${props.publicKey}`}
      fetch={() =>
        horizon
          .accounts()
          .accountId(props.publicKey)
          .call()
      }
      then={(accountData: any) =>
        accountData.home_domain ? <span style={{ userSelect: "text" }}>{accountData.home_domain}</span> : fallback
      }
      catch={() => fallback}
      pending={fallback}
    />
  )
})

async function fetchHorizonMetadata(horizon: Server) {
  const response = await fetch(getHorizonURL(horizon))
  return response.json()
}

async function fetchLatestLedger(horizon: Server) {
  const horizonMeta = await fetchHorizonMetadata(horizon)
  const ledgerData = await horizon
    .ledgers()
    .ledger(horizonMeta.history_latest_ledger)
    .call()
  return ledgerData
}

type LedgerDataRenderProp = (ledgerData: ServerApi.LedgerRecord) => React.ReactNode

const LedgerMetadata = (props: { children: LedgerDataRenderProp; testnet: boolean }) => {
  const horizon = useHorizon(props.testnet)
  return <Memoized cacheKey={getHorizonURL(horizon)} fetch={() => fetchLatestLedger(horizon)} then={props.children} />
}

// tslint:disable-next-line no-shadowed-variable
export const MinimumAccountBalance = React.memo(function MinimumAccountBalance(props: { testnet: boolean }) {
  return (
    <LedgerMetadata testnet={props.testnet}>
      {ledgerData => <>{(ledgerData.base_reserve_in_stroops / 1e7) * 2}</>}
    </LedgerMetadata>
  )
})
