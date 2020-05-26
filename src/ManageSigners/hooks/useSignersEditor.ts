import React from "react"
import { Horizon, Operation, Server, Transaction, xdr } from "stellar-sdk"
import { trackError } from "~App/contexts/notifications"
import { Account } from "~App/contexts/accounts"
import { AccountData } from "~Generic/lib/account"
import { createTransaction } from "~Generic/lib/transaction"

export interface SignersEditorOptions {
  account: Account
  accountData: AccountData
  horizon: Server
  sendTransaction: (tx: Transaction) => void
}

export interface SignersUpdate {
  signersToAdd: Horizon.AccountSigner[]
  signersToRemove: Horizon.AccountSigner[]
  weightThreshold: number
}

function createTxOperations(options: SignersEditorOptions, update: SignersUpdate): xdr.Operation[] {
  const operations: xdr.Operation[] = [
    // signer removals before adding, so you can remove and immediately re-add signer
    ...update.signersToRemove.map(signer =>
      Operation.setOptions({
        signer: { ed25519PublicKey: signer.key, weight: 0 }
      })
    ),
    ...update.signersToAdd.map(signer =>
      Operation.setOptions({
        signer: { ed25519PublicKey: signer.key, weight: signer.weight }
      })
    )
  ]

  if (
    update.weightThreshold !== options.accountData.thresholds.low_threshold &&
    update.weightThreshold !== options.accountData.thresholds.med_threshold &&
    update.weightThreshold !== options.accountData.thresholds.high_threshold
  ) {
    operations.push(
      Operation.setOptions({
        lowThreshold: update.weightThreshold,
        medThreshold: update.weightThreshold,
        highThreshold: update.weightThreshold
      })
    )
  }

  return operations
}

export function useSignersEditor(options: SignersEditorOptions) {
  const [txCreationPending, setTxCreationPending] = React.useState(false)

  const applyUpdate = async (update: SignersUpdate) => {
    try {
      setTxCreationPending(true)
      const operations = createTxOperations(options, update)

      const tx = await createTransaction(operations, {
        accountData: options.accountData,
        horizon: options.horizon,
        walletAccount: options.account
      })

      const submissionPromise = options.sendTransaction(tx)
      setTxCreationPending(false)

      await submissionPromise
    } catch (error) {
      trackError(error)
      setTxCreationPending(false)
    }
  }

  return {
    applyUpdate,
    txCreationPending
  }
}
