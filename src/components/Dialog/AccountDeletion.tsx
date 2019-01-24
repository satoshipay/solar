import React from "react"
import { useContext } from "react"
import Dialog from "@material-ui/core/Dialog"
import DialogContent from "@material-ui/core/DialogContent"
import DialogContentText from "@material-ui/core/DialogContentText"
import DialogTitle from "@material-ui/core/DialogTitle"
import DeleteIcon from "@material-ui/icons/Delete"
import WarnIcon from "@material-ui/icons/Warning"
import { Account, AccountsContext } from "../../context/accounts"
import AccountBalances from "../Account/AccountBalances"
import Background from "../Background"
import { ActionButton, DialogActionsBox } from "./Generic"

interface Props {
  account: Account
  open: boolean
  onClose: () => void
  onDeleted: () => void
}

function AccountDeletionDialog(props: Props) {
  const { deleteAccount } = useContext(AccountsContext)
  return (
    <Dialog open={props.open} onClose={props.onClose}>
      <Background opacity={0.08}>
        <WarnIcon style={{ fontSize: 160 }} />
      </Background>
      <DialogTitle>Confirm Account Deletion</DialogTitle>
      <DialogContent>
        <DialogContentText style={{ marginTop: 16 }}>
          Are you sure you want to delete the account "{props.account.name}
          "?
          <br />
          Make sure to backup your private key if there are still funds on the account!
        </DialogContentText>
        <DialogContentText style={{ marginTop: 16 }}>
          Balance: <AccountBalances publicKey={props.account.publicKey} testnet={props.account.testnet} />
        </DialogContentText>
        <DialogActionsBox>
          <ActionButton onClick={props.onClose}>Cancel</ActionButton>
          <ActionButton
            autoFocus
            icon={<DeleteIcon />}
            onClick={() => {
              deleteAccount(props.account.id)
              props.onClose()
              props.onDeleted()
            }}
            type="primary"
          >
            Delete
          </ActionButton>
        </DialogActionsBox>
      </DialogContent>
    </Dialog>
  )
}

export default AccountDeletionDialog
