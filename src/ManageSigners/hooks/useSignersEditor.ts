import React from "react"
import { Horizon, Operation, Server, Transaction, xdr } from "stellar-sdk"
import { trackError } from "~App/contexts/notifications"
import { Account } from "~App/contexts/accounts"
import { SettingsContext, SettingsContextType } from "~App/contexts/settings"
import { useLiveAccountData } from "~Generic/hooks/stellar-subscriptions"
import { AccountData } from "~Generic/lib/account"
import { createTransaction } from "~Generic/lib/transaction"
import { initializeEditorState, SignersEditorState } from "../lib/editor"

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

function createTxOperations(
  accountData: AccountData,
  settings: SettingsContextType,
  update: SignersUpdate
): xdr.Operation[] {
  const operations: xdr.Operation[] = [
    // signer removals before adding, so you can remove and immediately re-add signer
    ...update.signersToRemove.map(signer => {
      if (signer.key === accountData.account_id) {
        return Operation.setOptions({
          masterWeight: 0
        })
      } else {
        return Operation.setOptions({
          signer: { ed25519PublicKey: signer.key, weight: 0 }
        })
      }
    }),
    ...update.signersToAdd.map(signer =>
      Operation.setOptions({
        signer: { ed25519PublicKey: signer.key, weight: signer.weight }
      })
    )
  ]

  if (!accountData.data_attr["config.multisig.coordinator"]) {
    operations.push(
      Operation.manageData({
        name: "config.multisig.coordinator",
        value: settings.multiSignatureCoordinator
      })
    )
  }

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

export function useSignersEditor(options: SignersEditorOptions) {
  const accountData = useLiveAccountData(options.account.accountID, options.account.testnet)
  const settings = React.useContext(SettingsContext)

  const [txCreationPending, setTxCreationPending] = React.useState(false)
  const [rawEditorState, setRawEditorState] = React.useState<SignersEditorState>()

  const initialEditorState = React.useMemo(() => initializeEditorState(accountData), [accountData])
  const editorState = rawEditorState || initialEditorState

  const setEditorState = React.useCallback(
    (update: SignersEditorState | React.SetStateAction<SignersEditorState>) => {
      if (typeof update === "function") {
        setRawEditorState(prev => update(prev || initialEditorState))
      } else {
        setRawEditorState(update)
      }
    },
    [setRawEditorState, initialEditorState]
  )

  const applyUpdate = async (update: SignersUpdate) => {
    try {
      setTxCreationPending(true)
      const operations = createTxOperations(accountData, settings, update)

      const tx = await createTransaction(operations, {
        accountData,
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
    editorState,
    setEditorState: setEditorState as React.Dispatch<React.SetStateAction<SignersEditorState>>,
    txCreationPending
  }
}
