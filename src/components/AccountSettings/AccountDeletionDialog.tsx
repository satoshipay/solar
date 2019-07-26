import React from "react"
import { Operation, Transaction, Server } from "stellar-sdk"
import DialogContent from "@material-ui/core/DialogContent"
import DialogContentText from "@material-ui/core/DialogContentText"
import { Switch, Typography } from "@material-ui/core"
import DeleteIcon from "@material-ui/icons/Delete"
import WarnIcon from "@material-ui/icons/Warning"
import { Account, AccountsContext } from "../../context/accounts"
import { createTransaction } from "../../lib/transaction"
import { useAccountData, useIsMobile, useIsSmallMobile } from "../../hooks"
import { closeAccountSubscriptions } from "../../subscriptions"
import AccountBalances from "../Account/AccountBalances"
import AccountSelectionList from "../Account/AccountSelectionList"
import Background from "../Background"
import MergeIcon from "../Icon/Merge"
import { Box } from "../Layout/Box"
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

  return (
    <Box width="100%" maxWidth={900} padding="32px" margin="0 auto">
      <Background opacity={0.08}>
        <WarnIcon style={{ fontSize: 160 }} />
      </Background>
      <MainTitle
        title={<span>Confirm Account Deletion</span>}
        titleColor="inherit"
        onBack={props.onClose}
        style={{ marginTop: 0, marginLeft: 0 }}
      />
      <DialogContent style={{ padding: isSmallScreen ? "0 4px" : "0 42px" }}>
        <DialogContentText
          style={{ display: accountData.activated ? undefined : "none", color: "inherit", marginTop: 12 }}
        >
          <AccountBalances publicKey={props.account.publicKey} testnet={props.account.testnet} />
        </DialogContentText>

        <DialogContentText style={{ marginTop: 16 }}>
          Are you sure you want to delete the account "{props.account.name}
          "?
        </DialogContentText>
        <DialogContentText style={{ display: accountData.activated ? undefined : "none", marginTop: 16 }}>
          Make sure to backup your private key or merge the funds into another account of yours, since there are still
          funds left!
        </DialogContentText>

        {accountData.activated ? (
          <>
            <Box style={{ display: "flex", marginTop: 24, marginLeft: -12, marginBottom: 8 }}>
              <Switch
                color="primary"
                checked={mergeAccountEnabled}
                onChange={() => setMergeAccountEnabled(!mergeAccountEnabled)}
              />
              <Typography
                onClick={() => setMergeAccountEnabled(!mergeAccountEnabled)}
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
            </Box>

            <AccountSelectionList
              disabled={!mergeAccountEnabled}
              accounts={accounts.filter(
                account => account.publicKey !== props.account.publicKey && account.testnet === props.account.testnet
              )}
              onChange={setSelectedMergeAccount}
              showAccounts="all"
              testnet={props.account.testnet}
            />
          </>
        ) : (
          undefined
        )}

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
    </Box>
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
