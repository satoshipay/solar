import wellKnownExchanges from "../well-known-stellar-exchanges.json"
import { MemoType, MemoID, MemoText, MemoNone } from "stellar-sdk"

export function isKnownExchange(publicKey: string) {
  return Boolean(wellKnownExchanges.find(exchange => exchange.address === publicKey))
}

export function getAcceptedMemoType(publicKey: string): MemoType {
  const exchangeEntries = wellKnownExchanges.filter(exchange => exchange.address === publicKey)

  const memoTypeMap: { [type: string]: MemoType } = {
    ["MEMO_ID"]: MemoID,
    ["MEMO_TEXT"]: MemoText
  }

  let memoType: MemoType = MemoNone

  exchangeEntries.forEach(exchange => {
    if (exchange.accepts) {
      memoType = memoTypeMap[exchange.accepts.memo]
    }
  })

  return memoType
}
