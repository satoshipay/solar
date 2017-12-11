import { observable } from 'mobx'

const accountObservableCache = new Map()

function createAccountObservable (horizon, accountPubKey) {
  const accountObservable = observable({
    balances: []
  })
  horizon.accounts().accountId(accountPubKey).cursor('now').stream({
    onmessage (accountData) {
      Object.assign(accountObservable, accountData)
    },
    onerror (error) {
      console.error(error)
    }
  })
  return accountObservable
}

// TODO: Memoize (!)
export function subscribeToAccount (horizon, accountPubKey) {
  const cacheKey = horizon.serverURL + accountPubKey

  if (!accountObservableCache.has(cacheKey)) {
    accountObservableCache.set(cacheKey, createAccountObservable(horizon, accountPubKey))
  }

  const accountObservable = accountObservableCache.get(cacheKey)
  return accountObservable
}
