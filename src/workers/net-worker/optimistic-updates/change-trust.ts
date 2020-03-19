import BigNumber from "big.js"
import { Horizon, Operation, Transaction } from "stellar-sdk"
import { balancelineToAsset } from "../../../lib/stellar"
import { OptimisticAccountUpdate } from "../../_util/optimistic-updates"

function addTrustline(
  horizonURL: string,
  operation: Operation.ChangeTrust,
  transaction: Transaction
): OptimisticAccountUpdate {
  return {
    apply(prevAccountData) {
      const newBalance: Horizon.BalanceLineAsset = {
        asset_code: operation.line.code,
        asset_issuer: operation.line.issuer,
        asset_type: "credit_alphanum12",
        balance: "0",
        buying_liabilities: "0",
        is_authorized: false,
        last_modified_ledger: 0,
        limit: operation.limit,
        selling_liabilities: "0"
      }
      return {
        ...prevAccountData,
        balances: prevAccountData.balances.some(bal => balancelineToAsset(bal).equals(operation.line))
          ? prevAccountData.balances
          : [...prevAccountData.balances, newBalance]
      }
    },
    effectsAccountID: operation.source || transaction.source,
    horizonURL,
    title: `Remove trustline for ${operation.line.code}`,
    transactionHash: transaction.hash().toString("hex")
  }
}

function removeTrustline(
  horizonURL: string,
  operation: Operation.ChangeTrust,
  transaction: Transaction
): OptimisticAccountUpdate {
  return {
    apply(prevAccountData) {
      return {
        ...prevAccountData,
        balances: prevAccountData.balances.filter(balance => !balancelineToAsset(balance).equals(operation.line))
      }
    },
    effectsAccountID: operation.source || transaction.source,
    horizonURL,
    title: `Remove trustline for ${operation.line.code}`,
    transactionHash: transaction.hash().toString("hex")
  }
}

function changeTrust(
  horizonURL: string,
  operation: Operation.ChangeTrust,
  transaction: Transaction
): OptimisticAccountUpdate[] {
  if (BigNumber(operation.limit).eq(0)) {
    return [removeTrustline(horizonURL, operation, transaction)]
  } else {
    return [addTrustline(horizonURL, operation, transaction)]
  }
}

export default changeTrust
