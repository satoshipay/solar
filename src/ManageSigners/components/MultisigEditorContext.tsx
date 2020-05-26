import React from "react"
import { Horizon, Operation, Server, Transaction, xdr } from "stellar-sdk"
import { trackError } from "~App/contexts/notifications"
import { Account } from "~App/contexts/accounts"
import { createEmptyAccountData, AccountData } from "~Generic/lib/account"
import { createTransaction } from "~Generic/lib/transaction"
import { useLiveAccountData } from "~Generic/hooks/stellar-subscriptions"

export interface SignersEditorOptions {
  account: Account
  horizon: Server
  sendTransaction: (tx: Transaction) => void
}

export interface SignersUpdate {
  signersToAdd: Horizon.AccountSigner[]
  signersToRemove: Horizon.AccountSigner[]
  weightThreshold: number
}

function createTxOperations(accountData: AccountData, update: SignersUpdate): xdr.Operation[] {
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
    update.weightThreshold !== accountData.thresholds.low_threshold &&
    update.weightThreshold !== accountData.thresholds.med_threshold &&
    update.weightThreshold !== accountData.thresholds.high_threshold
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

function useSignersEditor(options: SignersEditorOptions) {
  const [txCreationPending, setTxCreationPending] = React.useState(false)
  const accountData = useLiveAccountData(options.account.accountID, options.account.testnet)

  const applyUpdate = async (update: SignersUpdate) => {
    try {
      setTxCreationPending(true)
      const operations = createTxOperations(accountData, update)

      const tx = await createTransaction(operations, {
        accountData,
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
    accountData,
    applyUpdate,
    txCreationPending
  }
}

interface MultisigEditorContextType {
  accountData: AccountData
  applyUpdate(update: SignersUpdate): any
  txCreationPending: boolean
}

export const MultisigEditorContext = React.createContext<MultisigEditorContextType>({
  accountData: createEmptyAccountData(""),
  applyUpdate() {
    throw Error("MultisigEditorContext has not yet been initialized")
  },
  txCreationPending: false
})

interface MultisigEditorProviderProps {
  account: Account
  children: React.ReactNode
  horizon: Server
  sendTransaction: (tx: Transaction) => void
}

export const MultisigEditorProvider = React.memo(function MultisigEditorProvider(props: MultisigEditorProviderProps) {
  const editor = useSignersEditor(props)

  return <MultisigEditorContext.Provider value={editor}>{props.children}</MultisigEditorContext.Provider>
})
