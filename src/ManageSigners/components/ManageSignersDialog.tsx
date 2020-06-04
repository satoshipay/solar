import React from "react"
import { Account } from "~App/contexts/accounts"
import TransactionSender from "~Transaction/components/TransactionSender"
import ManageSignersDialogContent from "./ManageSignersDialogContent"
import { MultisigEditorProvider } from "./MultisigEditorContext"

interface Props {
  account: Account
  onClose: () => void
}

function ManageSignersDialogContainer(props: Props) {
  return (
    <TransactionSender account={props.account}>
      {({ horizon, sendTransaction }) => (
        <MultisigEditorProvider account={props.account} horizon={horizon} sendTransaction={sendTransaction}>
          <ManageSignersDialogContent onCancel={props.onClose} testnet={props.account.testnet} />
        </MultisigEditorProvider>
      )}
    </TransactionSender>
  )
}

export default React.memo(ManageSignersDialogContainer)
