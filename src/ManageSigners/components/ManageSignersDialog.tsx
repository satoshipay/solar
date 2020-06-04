import React from "react"
import { useTranslation } from "react-i18next"
import { Server, Transaction } from "stellar-sdk"
import { Account } from "~App/contexts/accounts"
import { useIsMobile } from "~Generic/hooks/userinterface"
import TransactionSender from "~Transaction/components/TransactionSender"
import MainTitle from "~Generic/components/MainTitle"
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
          <ManageSignersDialogContent onCancel={props.onClose} />
        </MultisigEditorProvider>
      )}
    </TransactionSender>
  )
}

export default React.memo(ManageSignersDialogContainer)
