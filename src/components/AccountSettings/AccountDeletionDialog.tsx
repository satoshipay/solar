import React from "react"
import { Operation, Transaction, Server } from "stellar-sdk"
import DialogContent from "@material-ui/core/DialogContent"
import DialogContentText from "@material-ui/core/DialogContentText"
import Switch from "@material-ui/core/Switch"
import Typography from "@material-ui/core/Typography"
import DeleteIcon from "@material-ui/icons/Delete"
import WarnIcon from "@material-ui/icons/Warning"
import { Account, AccountsContext } from "../../context/accounts"
import { createTransaction } from "../../lib/transaction"
import { useAccountData, useIsMobile, useIsSmallMobile } from "../../hooks"
import { closeAccountSubscriptions } from "../../subscriptions"
import AccountSelectionList from "../Account/AccountSelectionList"
import ScrollableBalances from "../AccountAssets/ScrollableBalances"
import DialogBody from "../Dialog/DialogBody"
import MergeIcon from "../Icon/Merge"
import { HorizontalLayout } from "../Layout/Box"
import MainTitle from "../MainTitle"
import TransactionSender from "../TransactionSender"
import { ActionButton, ConfirmDialog, DialogActionsBox } from "../Dialog/Generic"

interface AccountDeletionDialogProps {
  account: Account
  horizon: Server
  onClose: () => void
  onDeleted: () => void
  sendTransaction: (account: Account, transaction: Transaction) => void
}

function AccountDeletionDialog(props: AccountDeletionDialogProps) {
  const accountData = useAccountData(props.account.publicKey, props.account.testnet)
  const horizon = props.horizon

  const { accounts, deleteAccount } = React.useContext(AccountsContext)
  const [mergeAccountEnabled, setMergeAccountEnabled] = React.useState(false)
  const [confirmationPending, setConfirmationPending] = React.useState(false)
  const [selectedMergeAccount, setSelectedMergeAccount] = React.useState<Account | null>(null)

  const isSmallScreen = useIsMobile()
  const isTinyScreen = useIsSmallMobile()

  const toggleMergeAccount = React.useCallback(() => setMergeAccountEnabled(enabled => !enabled), [])

  const onDelete = () => {
    deleteAccount(props.account.id)
    closeAccountSubscriptions(props.horizon, props.account.publicKey)
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

      await props.sendTransaction(props.account, transaction)
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
      accountData.activated ? (
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
                fontSize: isSmallScreen ? 16 : 20
              }}
            >
              Send remaining funds to
            </Typography>
          </HorizontalLayout>

          <AccountSelectionList
            accounts={accounts.filter(
              account => account.publicKey !== props.account.publicKey && account.testnet === props.account.testnet
            )}
            disabled={!mergeAccountEnabled}
            onChange={setSelectedMergeAccount}
            showAccounts="all"
            testnet={props.account.testnet}
          />
        </>
      ) : null,
    [props.account, accounts, accountData, mergeAccountEnabled, setMergeAccountEnabled, setSelectedMergeAccount]
  )

  return (
    <DialogBody
      background={<WarnIcon style={{ fontSize: 160 }} />}
      top={
        <>
          <MainTitle
            title={<span>Confirm Account Deletion</span>}
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
              {isTinyScreen ? "Merge" : "Merge into"}
            </ActionButton>
          ) : (
            <ActionButton autoFocus icon={<DeleteIcon />} onClick={() => setConfirmationPending(true)} type="primary">
              Delete
            </ActionButton>
          )}
        </DialogActionsBox>
      }
    >
      <DialogContent style={{ padding: 0 }}>
        <DialogContentText style={{ marginTop: 24 }}>
          Are you sure you want to delete the account "{props.account.name}
          "?
        </DialogContentText>
        <DialogContentText style={{ display: accountData.activated ? undefined : "none", marginTop: 16 }}>
          Make sure to backup your private key or merge the funds into another account of yours, since there are still
          funds left!
        </DialogContentText>

        {remainingFundsContent}

        <ConfirmDialog
          cancelButton={<ActionButton onClick={() => setConfirmationPending(false)}>Cancel</ActionButton>}
          confirmButton={
            <ActionButton onClick={onConfirm} type="primary">
              Confirm
            </ActionButton>
          }
          open={confirmationPending}
          onClose={() => setConfirmationPending(false)}
          title="Confirm deletion"
        >
          The account will be deleted
          {mergeAccountEnabled ? " and the remaining funds transferred" : ""}. Are you sure?
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
    <TransactionSender testnet={props.account.testnet}>
      {txContext => <AccountDeletionDialog {...props} {...txContext} />}
    </TransactionSender>
  )
}

export default AccountDeletionContainer
