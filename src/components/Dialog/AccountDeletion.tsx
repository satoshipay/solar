import React from "react"
import { Operation, Transaction, Server } from "stellar-sdk"
import DialogContent from "@material-ui/core/DialogContent"
import DialogContentText from "@material-ui/core/DialogContentText"
import { Switch, Typography } from "@material-ui/core"
import DeleteIcon from "@material-ui/icons/Delete"
import WarnIcon from "@material-ui/icons/Warning"
import MergeIcon from "../Icon/Merge"
import { Account, AccountsContext } from "../../context/accounts"
import { createTransaction } from "../../lib/transaction"
import { ObservedAccountData, useIsMobile, useIsSmallMobile } from "../../hooks"
import AccountBalances from "../Account/AccountBalances"
import Background from "../Background"
import AccountSelectionList from "../Account/AccountSelectionList"
import { Box } from "../Layout/Box"
import MainTitle from "../MainTitle"
import TransactionSender from "../TransactionSender"
import { ActionButton, DialogActionsBox } from "./Generic"

interface AccountDeletionDialogProps {
  account: Account
  horizon: Server
  accountData: ObservedAccountData
  onClose: () => void
  onDeleted: () => void
  sendTransaction: (transaction: Transaction) => void
}

function AccountDeletionDialog(props: AccountDeletionDialogProps) {
  const { accounts, deleteAccount } = React.useContext(AccountsContext)
  const [mergeAccountEnabled, setMergeAccountEnabled] = React.useState(false)
  const [selectedMergeAccount, setSelectedMergeAccount] = React.useState<Account | null>(null)

  const isSmallScreen = useIsMobile()
  const isTinyScreen = useIsSmallMobile()

  const onDelete = () => {
    deleteAccount(props.account.id)
    props.onClose()
    props.onDeleted()
  }

  const onMerge = async () => {
    if (selectedMergeAccount) {
      const { accountData, horizon } = props

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
          style={{ display: props.accountData.activated ? undefined : "none", color: "inherit", marginTop: 12 }}
        >
          <AccountBalances publicKey={props.account.publicKey} testnet={props.account.testnet} />
        </DialogContentText>

        <DialogContentText style={{ marginTop: 16 }}>
          Are you sure you want to delete the account "{props.account.name}
          "?
        </DialogContentText>
        <DialogContentText style={{ display: props.accountData.activated ? undefined : "none", marginTop: 16 }}>
          Make sure to backup your private key or merge the funds into another account of yours, since there are still
          funds left!
        </DialogContentText>

        {props.accountData.activated ? (
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
              testnet={props.account.testnet}
              onChange={setSelectedMergeAccount}
            />
          </>
        ) : (
          undefined
        )}

        <DialogActionsBox>
          {mergeAccountEnabled ? (
            <ActionButton autoFocus icon={<MergeIcon />} onClick={onMerge} type="primary">
              {isTinyScreen ? "Merge" : "Merge into"}
            </ActionButton>
          ) : (
            <ActionButton autoFocus icon={<DeleteIcon />} onClick={onDelete} type="primary">
              Delete
            </ActionButton>
          )}
        </DialogActionsBox>
      </DialogContent>
    </Box>
  )
}

interface AccountDeletionContainerProps {
  account: Account
  accountData: ObservedAccountData
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
