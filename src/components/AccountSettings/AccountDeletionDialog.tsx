import React from "react"
import { useTranslation } from "react-i18next"
import { Operation, Transaction, Server } from "stellar-sdk"
import DialogContent from "@material-ui/core/DialogContent"
import DialogContentText from "@material-ui/core/DialogContentText"
import Switch from "@material-ui/core/Switch"
import Typography from "@material-ui/core/Typography"
import DeleteIcon from "@material-ui/icons/Delete"
import WarnIcon from "@material-ui/icons/Warning"
import { Account, AccountsContext } from "../../context/accounts"
import { createTransaction } from "../../lib/transaction"
import { useLiveAccountData } from "../../hooks/stellar-subscriptions"
import { useIsMobile, useIsSmallMobile } from "../../hooks/userinterface"
import AccountSelectionList from "../Account/AccountSelectionList"
import DialogBody from "../Dialog/DialogBody"
import MergeIcon from "../Icon/Merge"
import { HorizontalLayout } from "../Layout/Box"
import ScrollableBalances from "../Lazy/ScrollableBalances"
import MainTitle from "../MainTitle"
import TransactionSender from "../TransactionSender"
import { ActionButton, ConfirmDialog, DialogActionsBox } from "../Dialog/Generic"

interface AccountDeletionDialogProps {
  account: Account
  horizon: Server
  onClose: () => void
  onDeleted: () => void
  sendTransaction: (transaction: Transaction) => void
}

function AccountDeletionDialog(props: AccountDeletionDialogProps) {
  const accountData = useLiveAccountData(props.account.publicKey, props.account.testnet)
  const horizon = props.horizon

  const { accounts, deleteAccount } = React.useContext(AccountsContext)
  const [mergeAccountEnabled, setMergeAccountEnabled] = React.useState(false)
  const [confirmationPending, setConfirmationPending] = React.useState(false)
  const [selectedMergeAccount, setSelectedMergeAccount] = React.useState<Account | null>(null)

  const { t } = useTranslation()
  const isSmallScreen = useIsMobile()
  const isTinyScreen = useIsSmallMobile()

  const toggleMergeAccount = React.useCallback(() => setMergeAccountEnabled(enabled => !enabled), [])

  const onDelete = () => {
    deleteAccount(props.account.id)
    props.onClose()
    props.onDeleted()
  }

  const onMerge = async () => {
    if (selectedMergeAccount) {
      const transaction = await createTransaction(
        [
          Operation.accountMerge({
            source: props.account.publicKey,
            destination: selectedMergeAccount.publicKey
          })
        ],
        { accountData, horizon, walletAccount: props.account }
      )

      await props.sendTransaction(transaction)
      setTimeout(onDelete, 1000)
    }
  }

  const onConfirm = () => {
    setConfirmationPending(false)
    if (mergeAccountEnabled) {
      onMerge()
    } else {
      onDelete()
    }
  }

  const remainingFundsContent = React.useMemo(
    () =>
      accountData.balances.length > 0 ? (
        <>
          <HorizontalLayout alignItems="center" style={{ marginTop: 24, marginLeft: -12, marginBottom: 8 }}>
            <Switch color="primary" checked={mergeAccountEnabled} onChange={toggleMergeAccount} />
            <Typography
              onClick={toggleMergeAccount}
              variant="h6"
              style={{
                display: "flex",
                alignItems: "center",
                height: 48,
                cursor: "pointer",
                fontSize: isSmallScreen ? 16 : 20,
                marginLeft: 8
              }}
            >
              {t("account-deletion.remaining-funds.text")}
            </Typography>
          </HorizontalLayout>

          <AccountSelectionList
            disabled={!mergeAccountEnabled}
            accounts={accounts.filter(
              account => account.publicKey !== props.account.publicKey && account.testnet === props.account.testnet
            )}
            testnet={props.account.testnet}
            onChange={setSelectedMergeAccount}
          />
        </>
      ) : null,
    [
      accountData.balances.length,
      mergeAccountEnabled,
      toggleMergeAccount,
      isSmallScreen,
      t,
      accounts,
      props.account.testnet,
      props.account.publicKey
    ]
  )

  return (
    <DialogBody
      background={<WarnIcon style={{ fontSize: 160 }} />}
      top={
        <>
          <MainTitle
            title={<span>{t("account-deletion.title")}</span>}
            titleColor="inherit"
            onBack={props.onClose}
            style={{ marginTop: 0, marginLeft: 0 }}
          />
          <ScrollableBalances account={props.account} compact />
        </>
      }
      actions={
        <DialogActionsBox>
          {mergeAccountEnabled ? (
            <ActionButton
              autoFocus
              disabled={!selectedMergeAccount}
              icon={<MergeIcon />}
              onClick={() => setConfirmationPending(true)}
              type="primary"
            >
              {isTinyScreen ? t("account-deletion.action.merge.short") : t("account-deletion.action.merge.long")}
            </ActionButton>
          ) : (
            <ActionButton autoFocus icon={<DeleteIcon />} onClick={() => setConfirmationPending(true)} type="primary">
              {t("account-deletion.action.delete")}
            </ActionButton>
          )}
        </DialogActionsBox>
      }
    >
      <DialogContent style={{ padding: 0 }}>
        <DialogContentText style={{ marginTop: 24 }}>
          {t("account-deletion.text.1", { accountName: props.account.name })}
        </DialogContentText>
        <DialogContentText style={{ display: accountData.balances.length > 0 ? undefined : "none", marginTop: 16 }}>
          {t("account-deletion.text.2")}
        </DialogContentText>

        {remainingFundsContent}

        <ConfirmDialog
          cancelButton={
            <ActionButton onClick={() => setConfirmationPending(false)}>
              {t("account-deletion.action.cancel")}
            </ActionButton>
          }
          confirmButton={
            <ActionButton onClick={onConfirm} type="primary">
              {t("account-deletion.action.confirm")}
            </ActionButton>
          }
          open={confirmationPending}
          onClose={() => setConfirmationPending(false)}
          title={t("account-deletion.confirm.title")}
        >
          {t("account-deletion.confirm.text.delete")}
          {mergeAccountEnabled ? ` ${t("account-deletion.confirm.text.merge")}. ` : ". "}
          {t("account-deletion.confirm.text.confirm")}
        </ConfirmDialog>
      </DialogContent>
    </DialogBody>
  )
}

interface AccountDeletionContainerProps {
  account: Account
  onClose: () => void
  onDeleted: () => void
}

function AccountDeletionContainer(props: AccountDeletionContainerProps) {
  return (
    <TransactionSender account={props.account}>
      {txContext => <AccountDeletionDialog {...props} {...txContext} />}
    </TransactionSender>
  )
}

export default AccountDeletionContainer
