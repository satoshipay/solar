import React from "react"
import { useTranslation } from "react-i18next"
import { Operation, Server, Transaction } from "stellar-sdk"
import useMediaQuery from "@material-ui/core/useMediaQuery"
import PersonAddIcon from "@material-ui/icons/PersonAdd"
import { Account } from "~App/contexts/accounts"
import { trackError } from "~App/contexts/notifications"
import { useLiveAccountData } from "~Generic/hooks/stellar-subscriptions"
import { useIsMobile } from "~Generic/hooks/userinterface"
import { AccountData } from "~Generic/lib/account"
import { createTransaction } from "~Generic/lib/transaction"
import { ActionButton } from "~Generic/components/DialogActions"
import ButtonIconLabel from "~Generic/components/ButtonIconLabel"
import MainTitle from "~Generic/components/MainTitle"
import TransactionSender from "~Transaction/components/TransactionSender"
import ManageSignersDialogContent, { SignerUpdate } from "./ManageSignersDialogContent"

type Omit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>

interface Props {
  account: Account
  accountData: AccountData
  horizon: Server
  onClose: () => void
  sendTransaction: (tx: Transaction) => void
}

function ManageSignersDialog(props: Props) {
  const [isEditingNewSigner, setIsEditingNewSigner] = React.useState(false)
  const [, setTxCreationPending] = React.useState(false)

  const isSmallScreen = useIsMobile()
  const isWidthMax450 = useMediaQuery("(max-width:450px)")
  const { t } = useTranslation()

  const submitTransaction = async (update: SignerUpdate) => {
    try {
      setTxCreationPending(true)

      const operations = [
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
        update.weightThreshold !== props.accountData.thresholds.low_threshold &&
        update.weightThreshold !== props.accountData.thresholds.med_threshold &&
        update.weightThreshold !== props.accountData.thresholds.high_threshold
      ) {
        operations.push(
          Operation.setOptions({
            lowThreshold: update.weightThreshold,
            medThreshold: update.weightThreshold,
            highThreshold: update.weightThreshold
          })
        )
      }

      const tx = await createTransaction(operations, {
        accountData: props.accountData,
        horizon: props.horizon,
        walletAccount: props.account
      })

      const submissionPromise = props.sendTransaction(tx)
      setTxCreationPending(false)

      await submissionPromise
    } catch (error) {
      trackError(error)
      setTxCreationPending(false)
    }
  }

  const titleContent = React.useMemo(
    () => (
      <MainTitle
        hideBackButton
        title={
          isSmallScreen
            ? t("account-settings.manage-signers.title.short")
            : t("account-settings.manage-signers.title.long")
        }
        actions={
          <>
            <ActionButton testnet={props.account.testnet} type="primary" onClick={() => setIsEditingNewSigner(true)}>
              <ButtonIconLabel
                label={
                  isWidthMax450
                    ? t("account-settings.manage-signers.action.add-co-signer.short")
                    : t("account-settings.manage-signers.action.add-co-signer.long")
                }
              >
                <PersonAddIcon />
              </ButtonIconLabel>
            </ActionButton>
          </>
        }
        onBack={props.onClose}
        style={{ marginBottom: 24 }}
      />
    ),
    [isSmallScreen, t, isWidthMax450, props.account, props.onClose]
  )

  return (
    <ManageSignersDialogContent
      accountData={props.accountData}
      isEditingNewSigner={isEditingNewSigner}
      onCancel={props.onClose}
      onSubmit={submitTransaction}
      setIsEditingNewSigner={setIsEditingNewSigner}
      testnet={props.account.testnet}
      title={titleContent}
    />
  )
}

function ManageSignersDialogContainer(props: Omit<Props, "accountData" | "horizon" | "sendTransaction">) {
  const accountData = useLiveAccountData(props.account.publicKey, props.account.testnet)
  return (
    <TransactionSender account={props.account}>
      {({ horizon, sendTransaction }) => (
        <ManageSignersDialog {...props} accountData={accountData} horizon={horizon} sendTransaction={sendTransaction} />
      )}
    </TransactionSender>
  )
}

export default React.memo(ManageSignersDialogContainer)
