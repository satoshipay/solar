import React from "react"
import { Transaction } from "stellar-sdk"
import { Account } from "~App/contexts/accounts"
import { useSignersEditor, SignersUpdate } from "../hooks/useSignersEditor"
import { MultisigPresets, SignersEditorState } from "../lib/editor"

export enum Step {
  Presets,
  Signers
}

interface MultisigEditorContextType {
  accountID: string
  currentStep: Step
  editorState: SignersEditorState
  setEditorState: React.Dispatch<React.SetStateAction<SignersEditorState>>
  switchToStep: React.Dispatch<React.SetStateAction<Step>>
  testnet: boolean
  txCreationPending: boolean
  applyUpdate(update: SignersUpdate): any
}

export const MultisigEditorContext = React.createContext<MultisigEditorContextType>({
  accountID: "",
  applyUpdate() {
    throw Error("MultisigEditorContext has not yet been initialized")
  },
  currentStep: Step.Presets,
  editorState: {
    preset: {
      type: MultisigPresets.Type.SingleSignature
    },
    signersToAdd: [],
    signersToRemove: []
  },
  setEditorState() {
    throw Error("MultisigEditorContext has not yet been initialized")
  },
  switchToStep() {
    throw Error("MultisigEditorContext has not yet been initialized")
  },
  testnet: false,
  txCreationPending: false
})

interface MultisigEditorProviderProps {
  account: Account
  children: React.ReactNode
  sendTransaction: (tx: Transaction) => void
}

export const MultisigEditorProvider = React.memo(function MultisigEditorProvider(props: MultisigEditorProviderProps) {
  const [currentStep, switchToStep] = React.useState<Step>(Step.Presets)
  const editor = useSignersEditor(props)

  const contextValue: MultisigEditorContextType = {
    ...editor,
    accountID: props.account.accountID,
    currentStep,
    switchToStep,
    testnet: props.account.testnet
  }

  return <MultisigEditorContext.Provider value={contextValue}>{props.children}</MultisigEditorContext.Provider>
})
