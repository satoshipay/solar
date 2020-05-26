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
  horizon: Server
  onClose: () => void
  sendTransaction: (tx: Transaction) => void
}

function ManageSignersDialog(props: Props) {
  const isSmallScreen = useIsMobile()
  const { t } = useTranslation()

  const title = React.useMemo(
    () => (
      <MainTitle
        hideBackButton
        title={
          isSmallScreen
            ? t("account-settings.manage-signers.title.short")
            : t("account-settings.manage-signers.title.long")
        }
        onBack={props.onClose}
        style={{ marginBottom: 24 }}
      />
    ),
    [isSmallScreen, t, props.onClose]
  )

  return (
    <MultisigEditorProvider account={props.account} horizon={props.horizon} sendTransaction={props.sendTransaction}>
      <ManageSignersDialogContent onCancel={props.onClose} testnet={props.account.testnet} title={title} />
    </MultisigEditorProvider>
  )
}

function ManageSignersDialogContainer(props: Omit<Props, "accountData" | "horizon" | "sendTransaction">) {
  return (
    <TransactionSender account={props.account}>
      {({ horizon, sendTransaction }) => (
        <ManageSignersDialog {...props} horizon={horizon} sendTransaction={sendTransaction} />
      )}
    </TransactionSender>
  )
}

export default React.memo(ManageSignersDialogContainer)
