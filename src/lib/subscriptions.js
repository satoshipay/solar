import Observable from 'zen-observable'

// TODO: Memoize (!)
export function subscribeToAccount (horizon, accountPubKey) {
  return new Observable(observer => {
    const unsubscribe = horizon.accounts().accountId(accountPubKey).cursor('now').stream({
      onmessage (accountData) {
        observer.next(accountData)
      },
      onerror (error) {
        observer.error(error)
      }
    })
    return () => unsubscribe()
  })
}
