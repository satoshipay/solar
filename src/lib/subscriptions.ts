import { observable } from 'mobx'
import { AccountRecord, Server, Transaction, TransactionRecord } from 'stellar-sdk'

export type AccountObservable = {
  balances: AccountRecord['balances']
}

export type RecentTxsObservable = {
  loading: boolean,
  transactions: Transaction[]
}

type URI = { toString: () => string }
type HorizonWithUndocumentedProps = Server & { serverURL: URI }

const accountObservableCache = new Map<string, AccountObservable>()
const accountRecentTxsCache = new Map<string, RecentTxsObservable>()

function createAccountObservable (horizon: Server, accountPubKey: string) {
  const accountObservable = observable({
    balances: []
  })
  let lastMessageJson = ''
  let lastErrorJson = ''

  horizon.accounts().accountId(accountPubKey).cursor('now').stream({
    onmessage (accountData: AccountRecord) {
      const serialized = JSON.stringify(accountData)
      if (serialized !== lastMessageJson) {
        // Deduplicate messages. Every few seconds there is a new message with an unchanged value.
        lastMessageJson = serialized
        Object.assign(accountObservable, accountData)
      }
    },
    onerror (error: any) {
      const serialized = JSON.stringify(error)
      if (serialized !== lastErrorJson) {
        // Deduplicate errors. Every few seconds there is a new useless error with the same data as the previous.
        lastErrorJson = serialized
        console.error(error)
      }
    }
  } as any)
  return accountObservable
}

async function setUpRecentTxsObservable (recentTxs: RecentTxsObservable, horizon: Server, accountPubKey: string) {
  const maxTxsToLoadCount = 15
  const deserializeTx = (txResponse: TransactionRecord) => Object.assign(new Transaction(txResponse.envelope_xdr), { created_at: txResponse.created_at })

  const loadRecentTxs = async () => {
    const { records } = await horizon.transactions().forAccount(accountPubKey).limit(maxTxsToLoadCount).order('desc').call()
    records.forEach(txResponse => recentTxs.transactions.push(deserializeTx(txResponse)))
    recentTxs.loading = false
  }
  const subscribeToTxs = () => {
    horizon.transactions().forAccount(accountPubKey).cursor('now').stream({
      onmessage (txResponse: TransactionRecord) {
        // Important: Insert new transactions in the front, since order is descending
        recentTxs.transactions.unshift(deserializeTx(txResponse))
      },
      onerror (error: any) {
        console.error(error)
      }
    } as any)
  }

  await loadRecentTxs()
  subscribeToTxs()

  return recentTxs
}

export function subscribeToAccount (horizon: Server, accountPubKey: string): AccountObservable {
  const cacheKey = (horizon as HorizonWithUndocumentedProps).serverURL + accountPubKey

  if (accountObservableCache.has(cacheKey)) {
    return accountObservableCache.get(cacheKey) as any as AccountObservable
  } else {
    const accountObservable = createAccountObservable(horizon, accountPubKey)
    accountObservableCache.set(cacheKey, accountObservable)
    return accountObservable
  }
}

export function subscribeToRecentTxs (horizon: Server, accountPubKey: string): RecentTxsObservable {
  const cacheKey = (horizon as HorizonWithUndocumentedProps).serverURL + accountPubKey

  if (accountRecentTxsCache.has(cacheKey)) {
    return accountRecentTxsCache.get(cacheKey) as any as RecentTxsObservable
  } else {
    const recentTxs = observable({
      loading: true,
      transactions: []
    })
    setUpRecentTxsObservable(recentTxs, horizon, accountPubKey)
    accountRecentTxsCache.set(cacheKey, recentTxs)
    return recentTxs
  }
}
