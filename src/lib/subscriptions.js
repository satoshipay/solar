import { observable } from 'mobx'
import { Transaction } from 'stellar-sdk'

const accountObservableCache = new Map()
const accountRecentTxsCache = new Map()

function createAccountObservable (horizon, accountPubKey) {
  const accountObservable = observable({
    balances: []
  })
  let lastMessageJson = ''

  horizon.accounts().accountId(accountPubKey).cursor('now').stream({
    onmessage (accountData) {
      const serialized = JSON.stringify(accountData)
      if (serialized !== lastMessageJson) {
        // Deduplicate messages. Every few seconds there is a new message with an unchanged value.
        lastMessageJson = serialized
        Object.assign(accountObservable, accountData)
      }
    },
    onerror (error) {
      console.error(error)
    }
  })
  return accountObservable
}

async function setUpRecentTxsObservable (recentTxs, horizon, accountPubKey) {
  const maxTxsToLoadCount = 15
  const deserializeTx = txResponse => Object.assign(new Transaction(txResponse.envelope_xdr), { created_at: txResponse.created_at })

  const loadRecentTxs = async () => {
    const { records } = await horizon.transactions().forAccount(accountPubKey).limit(maxTxsToLoadCount).order('desc').call()
    records.forEach(txResponse => recentTxs.transactions.push(deserializeTx(txResponse)))
    recentTxs.loading = false
  }
  const subscribeToTxs = () => {
    horizon.transactions().forAccount(accountPubKey).cursor('now').stream({
      onmessage (txResponse) {
        recentTxs.transactions.push(deserializeTx(txResponse))
      },
      onerror (error) {
        console.error(error)
      }
    })
  }

  await loadRecentTxs()
  subscribeToTxs()

  return recentTxs
}

export function subscribeToAccount (horizon, accountPubKey) {
  const cacheKey = horizon.serverURL + accountPubKey

  if (!accountObservableCache.has(cacheKey)) {
    accountObservableCache.set(cacheKey, createAccountObservable(horizon, accountPubKey))
  }

  const accountObservable = accountObservableCache.get(cacheKey)
  return accountObservable
}

export function subscribeToRecentTxs (horizon, accountPubKey) {
  const cacheKey = horizon.serverURL + accountPubKey

  if (!accountRecentTxsCache.has(cacheKey)) {
    const recentTxs = observable({
      loading: true,
      transactions: []
    })
    setUpRecentTxsObservable(recentTxs, horizon, accountPubKey)
    accountRecentTxsCache.set(cacheKey, recentTxs)
  }

  const accountObservable = accountRecentTxsCache.get(cacheKey)
  return accountObservable
}
