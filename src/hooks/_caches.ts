import { Server, Transaction } from "stellar-sdk"
import { AccountData } from "../lib/account"
import { max } from "../lib/strings"

const getTxCreatedAt = (tx: Transaction) => (tx as any).created_at as string

function createAccountDataCache() {
  const cache = new Map<string, AccountData>()

  return {
    get(horizon: Server, accountID: string) {
      return cache.get(`${horizon.serverURL}:${accountID}`)
    },
    set(horizon: Server, accountID: string, accountData: AccountData) {
      const cached = cache.get(`${horizon.serverURL}:${accountID}`)
      if (!cached || accountData.paging_token > cached.paging_token) {
        cache.set(`${horizon.serverURL}:${accountID}`, accountData)
      }
    }
  }
}

function createAccountTransactionsCache() {
  const cache = new Map<string, Transaction[]>()

  return {
    get(horizon: Server, accountID: string) {
      return cache.get(`${horizon.serverURL}:${accountID}`)
    },
    set(horizon: Server, accountID: string, txs: Transaction[]) {
      const cached = cache.get(`${horizon.serverURL}:${accountID}`)
      const cachedMaxTimestamp = (cached ? max(cached.map(tx => getTxCreatedAt(tx))) : undefined) || ""
      const newMaxTimestamp = max(txs.map(tx => getTxCreatedAt(tx))) || ""

      if (!cached || newMaxTimestamp > cachedMaxTimestamp) {
        cache.set(`${horizon.serverURL}:${accountID}`, txs)
      }
    }
  }
}

export const accountDataCache = createAccountDataCache()
export const accountTransactionsCache = createAccountTransactionsCache()
