import BigNumber from "big.js"
import { Asset, Operation, Transaction } from "stellar-sdk"

export type PaymentSummary = Array<{
  asset: Asset
  balanceChange: BigNumber
  publicKeys: string[]
}>

export function getPaymentSummary(accountPublicKey: string, transaction: Transaction) {
  const balanceChanges: PaymentSummary = []

  const paymentOps: Array<Operation.Payment | Operation.CreateAccount> = transaction.operations.filter(
    op => op.type === "payment" || op.type === "createAccount"
  ) as any

  for (const operation of paymentOps) {
    const amount = (operation as Operation.Payment).amount || (operation as Operation.CreateAccount).startingBalance
    const asset = (operation as Operation.Payment).asset || Asset.native()

    const summaryItem = balanceChanges.find(assetBalanceChange => assetBalanceChange.asset.equals(asset))
    let balanceChange = summaryItem ? summaryItem.balanceChange : BigNumber(0)
    let remotePublicKey: string | null = null

    if (operation.destination === (operation.source || transaction.source)) {
      // leave at zero, since source equals destination
    } else if (operation.destination === accountPublicKey) {
      // incoming payment
      balanceChange = balanceChange.add(amount)
      remotePublicKey = operation.source || transaction.source
    } else if (
      operation.source === accountPublicKey ||
      (!operation.source && transaction.source === accountPublicKey)
    ) {
      // outgoing payment
      balanceChange = balanceChange.sub(amount)
      remotePublicKey = operation.destination
    }

    if (summaryItem) {
      summaryItem.balanceChange = balanceChange
      summaryItem.publicKeys = remotePublicKey ? summaryItem.publicKeys.concat(remotePublicKey) : summaryItem.publicKeys
    } else {
      balanceChanges.push({
        asset,
        balanceChange,
        publicKeys: remotePublicKey ? [remotePublicKey] : []
      })
    }
  }

  return balanceChanges
}
