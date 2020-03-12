import { Horizon, Operation, Transaction } from "stellar-sdk"
import {
  addAccountUpdates,
  getAccountUpdates,
  newOptimisticAccountUpdates,
  removeStaleAccountUpdates,
  OptimisticAccountUpdate,
  OptimisticUpdate
} from "../../_util/optimistic-updates"
import handleChangeTrust from "./change-trust"
import handleSetOptions from "./set-options"

export { OptimisticAccountUpdate, newOptimisticAccountUpdates }

function fromOperation(
  horizonURL: string,
  operation: Operation,
  transaction: Transaction
): Array<OptimisticUpdate<Horizon.AccountResponse>> {
  if (operation.type === "changeTrust") {
    return handleChangeTrust(horizonURL, operation, transaction)
  } else if (operation.type === "setOptions") {
    return handleSetOptions(horizonURL, operation, transaction)
  } else {
    return []
  }
}

export function handleSubmittedTransaction(horizonURL: string, transaction: Transaction) {
  for (const operation of transaction.operations) {
    const optimisticUpdates = fromOperation(horizonURL, operation, transaction)
    addAccountUpdates(optimisticUpdates)
  }
}

export function optimisticallyUpdateAccountData<AccountData extends Horizon.AccountResponse>(
  horizonURL: string,
  accountData: AccountData
): AccountData {
  const optimisticUpdates = getAccountUpdates(horizonURL, accountData.account_id)

  return optimisticUpdates.reduce((updatedAccountData, update) => update.apply(updatedAccountData), accountData)
}

export function removeStaleOptimisticUpdates(horizonURL: string, latestTransactionHashs: string[]) {
  removeStaleAccountUpdates(horizonURL, latestTransactionHashs)
}
