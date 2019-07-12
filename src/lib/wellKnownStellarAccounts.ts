import wellKnownAccountsData from "../well-known-stellar-accounts.json"

const wellKnownAccounts = wellKnownAccountsData._embedded.records

export function isKnownExchange(publicKey: string) {
  return Boolean(
    wellKnownAccounts.find(account => account.address === publicKey && account.tags.indexOf("exchange") !== -1)
  )
}
