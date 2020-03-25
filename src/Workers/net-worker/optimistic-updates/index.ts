import { Horizon, Operation, ServerApi, Transaction } from "stellar-sdk"
import {
  accountDataUpdates,
  offerUpdates,
  OptimisticAccountUpdate,
  OptimisticOfferUpdate
} from "../../lib/optimistic-updates"
import handleChangeTrust from "./change-trust"
import handleManageOffer from "./manage-offer"
import handleSetOptions from "./set-options"

export { accountDataUpdates, offerUpdates, OptimisticAccountUpdate, OptimisticOfferUpdate }

function ingestOperation(horizonURL: string, operation: Operation, transaction: Transaction) {
  if (operation.type === "changeTrust") {
    accountDataUpdates.addUpdates(handleChangeTrust(horizonURL, operation, transaction))
  } else if (operation.type === "setOptions") {
    accountDataUpdates.addUpdates(handleSetOptions(horizonURL, operation, transaction))
  } else if (operation.type === "manageBuyOffer" || operation.type === "manageSellOffer") {
    offerUpdates.addUpdates(handleManageOffer(horizonURL, operation, transaction))
  }
}

export function handleSubmittedTransaction(horizonURL: string, transaction: Transaction) {
  for (const operation of transaction.operations) {
    ingestOperation(horizonURL, operation, transaction)
  }
}

export function optimisticallyUpdateAccountData(
  horizonURL: string,
  accountData: Horizon.AccountResponse
): Horizon.AccountResponse {
  const optimisticUpdates = accountDataUpdates.getUpdates(horizonURL, accountData.account_id)
  return optimisticUpdates.reduce((updatedAccountData, update) => update.apply(updatedAccountData), accountData)
}

export function optimisticallyUpdateOffers(
  horizonURL: string,
  accountID: string,
  openOffers: ServerApi.OfferRecord[]
): ServerApi.OfferRecord[] {
  const optimisticUpdates = offerUpdates.getUpdates(horizonURL, accountID)
  const updated = optimisticUpdates.reduce((updatedOffers, update) => update.apply(updatedOffers), openOffers)
  return updated
}

export function removeStaleOptimisticUpdates(horizonURL: string, latestTransactionHashs: string[]) {
  accountDataUpdates.removeStaleUpdates(horizonURL, latestTransactionHashs)
  offerUpdates.removeStaleUpdates(horizonURL, latestTransactionHashs)
}
