import { observable } from "mobx"
import {
  AccountRecord,
  Server,
  Transaction,
  TransactionRecord
} from "stellar-sdk"
import { addError } from "../stores/errors"
import { waitForAccountData } from "./account"

export interface AccountObservable {
  activated: boolean
  balances: AccountRecord["balances"]
}

export interface RecentTxsObservable {
  activated: boolean
  loading: boolean
  transactions: Transaction[]
}

interface URI {
  toString: () => string
}
type HorizonWithUndocumentedProps = Server & { serverURL: URI }

const accountObservableCache = new Map<string, AccountObservable>()
const accountRecentTxsCache = new Map<string, RecentTxsObservable>()

function createAccountObservable(horizon: Server, accountPubKey: string) {
  const accountObservable = observable({
    activated: false,
    balances: []
  })

  const subscribeToAccountDataStream = () => {
    let lastMessageJson = ""
    let lastMessageTime = 0

    horizon
      .accounts()
      .accountId(accountPubKey)
      .cursor("now")
      .stream({
        onmessage(accountData: AccountRecord) {
          const serialized = JSON.stringify(accountData)
          if (serialized !== lastMessageJson) {
            // Deduplicate messages. Every few seconds there is a new message with an unchanged value.
            lastMessageJson = serialized
            Object.assign(accountObservable, accountData)
          }
          lastMessageTime = Date.now()
        },
        onerror(error: any) {
          setTimeout(() => {
            if (Date.now() - lastMessageTime > 2500) {
              // Every few seconds there is a new useless error with the same data as the previous.
              // So don't show them if there is a successful message afterwards (stream still seems to work)
              addError(new Error("Account data update stream errored."))
            } else {
              // tslint:disable-next-line:no-console
              console.warn(
                "Account data update stream had an error, but still seems to work fine:",
                error
              )
            }
          }, 2500)
        }
      } as any)
  }

  waitForAccountData(horizon, accountPubKey)
    .then(accountData => {
      Object.assign(accountObservable, accountData, { activated: true })
      subscribeToAccountDataStream()
    })
    .catch(addError)

  return accountObservable
}

async function setUpRecentTxsObservable(
  recentTxs: RecentTxsObservable,
  horizon: Server,
  accountPubKey: string
) {
  const maxTxsToLoadCount = 15
  const deserializeTx = (txResponse: TransactionRecord) =>
    Object.assign(new Transaction(txResponse.envelope_xdr), {
      created_at: txResponse.created_at
    })

  const loadRecentTxs = async () => {
    const { records } = await horizon
      .transactions()
      .forAccount(accountPubKey)
      .limit(maxTxsToLoadCount)
      .order("desc")
      .call()
    records.forEach(txResponse =>
      recentTxs.transactions.push(deserializeTx(txResponse))
    )
  }
  const subscribeToTxs = () => {
    horizon
      .transactions()
      .forAccount(accountPubKey)
      .cursor("now")
      .stream({
        onmessage(txResponse: TransactionRecord) {
          // Important: Insert new transactions in the front, since order is descending
          recentTxs.transactions.unshift(deserializeTx(txResponse))
        },
        onerror(error: any) {
          addError(new Error("Recent transactions update stream errored."))

          // tslint:disable-next-line:no-console
          console.error(error)
        }
      } as any)
  }

  try {
    await loadRecentTxs()
    recentTxs.activated = true
    recentTxs.loading = false
    subscribeToTxs()
  } catch (error) {
    if (error.response && error.response.status === 404) {
      recentTxs.activated = false
      recentTxs.loading = false
      waitForAccountData(horizon, accountPubKey)
        .then(() => {
          recentTxs.activated = true
          subscribeToTxs()
        })
        .catch(addError)
    } else {
      throw error
    }
  }

  return recentTxs
}

export function subscribeToAccount(
  horizon: Server,
  accountPubKey: string
): AccountObservable {
  const cacheKey =
    (horizon as HorizonWithUndocumentedProps).serverURL + accountPubKey

  if (accountObservableCache.has(cacheKey)) {
    return (accountObservableCache.get(cacheKey) as any) as AccountObservable
  } else {
    const accountObservable = createAccountObservable(horizon, accountPubKey)
    accountObservableCache.set(cacheKey, accountObservable)
    return accountObservable
  }
}

export function subscribeToRecentTxs(
  horizon: Server,
  accountPubKey: string
): RecentTxsObservable {
  const cacheKey =
    (horizon as HorizonWithUndocumentedProps).serverURL + accountPubKey

  if (accountRecentTxsCache.has(cacheKey)) {
    return (accountRecentTxsCache.get(cacheKey) as any) as RecentTxsObservable
  } else {
    const recentTxs = observable({
      activated: false,
      loading: true,
      transactions: []
    })
    setUpRecentTxsObservable(recentTxs, horizon, accountPubKey).catch(addError)
    accountRecentTxsCache.set(cacheKey, recentTxs)
    return recentTxs
  }
}
