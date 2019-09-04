import fetch from "isomorphic-fetch"
import { MemoType, MemoID, MemoText, MemoNone } from "stellar-sdk"
import { trackError, trackConnectionError } from "../context/notifications"

interface AccountRecord {
  address: string
  paging_token: string
  name: string
  tags: string[]
  domain: string
  accepts: {
    memo: string
  }
}

export function fetchStellarExpertAccountDirectory() {
  fetch(`https://api.stellar.expert/api/explorer/public/directory`).then(async response => {
    if (response.status >= 400) {
      trackConnectionError(`Bad response (${response.status}) from stellar.expert server`)
    }

    try {
      const json = await response.json()
      const knownAccounts = json._embedded.records
      localStorage.setItem("known-accounts", JSON.stringify(knownAccounts))
    } catch (error) {
      trackError("Something went wrong while parsing the stellar.expert response.")
    }
  })
}

export function getKnownAccounts() {
  const cachedAccountsString = localStorage.getItem("known-accounts")
  if (cachedAccountsString) {
    const accounts = JSON.parse(cachedAccountsString) as AccountRecord[]
    return accounts
  } else {
    return null
  }
}

function getKnownExchanges() {
  const knownAccounts = getKnownAccounts()
  if (knownAccounts) {
    return knownAccounts.filter(account => account.tags.indexOf("exchange") !== -1)
  } else {
    return null
  }
}

export function isKnownExchange(publicKey: string) {
  const knownExchanges = getKnownExchanges()
  return knownExchanges ? Boolean(knownExchanges.find(exchange => exchange.address === publicKey)) : false
}

const memoTypeMap: { [type: string]: MemoType } = {
  ["MEMO_ID"]: MemoID,
  ["MEMO_TEXT"]: MemoText
}

export function getAcceptedMemoType(publicKey: string): MemoType {
  const knownExchanges = getKnownExchanges()

  let memoType: MemoType = MemoNone
  if (knownExchanges) {
    const exchangeEntries = knownExchanges.filter(exchange => exchange.address === publicKey)

    exchangeEntries.forEach(exchange => {
      if (exchange.accepts) {
        memoType = memoTypeMap[exchange.accepts.memo]
      }
    })
  }

  return memoType
}
