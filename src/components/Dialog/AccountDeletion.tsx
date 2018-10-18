import React from "react"
import Button from "@material-ui/core/Button"
import Dialog from "@material-ui/core/Dialog"
import DialogActions from "@material-ui/core/DialogActions"
import DialogContent from "@material-ui/core/DialogContent"
import DialogContentText from "@material-ui/core/DialogContentText"
import DialogTitle from "@material-ui/core/DialogTitle"
import DeleteIcon from "@material-ui/icons/Delete"
import WarnIcon from "@material-ui/icons/Warning"
import { Account, AccountsContext } from "../../context/accounts"
import AccountBalances from "../Account/AccountBalances"
import Background from "../Background"
import ButtonIconLabel from "../ButtonIconLabel"

interface Props {
  account: Account
  open: boolean
  deleteAccount: AccountsContext["deleteAccount"]
  onClose: () => void
  onDeleted: () => void
}

const AccountDeletionDialog = (props: Props) => {
  const { deleteAccount } = props
  const onConfirm = () => {
    deleteAccount(props.account.id)
    props.onClose()
    props.onDeleted()
  }
  return (
    <Dialog open={props.open} onClose={props.onClose}>
      <Background opacity={0.08}>
        <WarnIcon style={{ fontSize: 160 }} />
      </Background>
      <DialogTitle>Confirm Account Deletion</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Are you sure you want to delete the account "{props.account.name}
          "?
          <br />
          Make sure to backup your private key if there are still funds on the account!
        </DialogContentText>
        <DialogContentText style={{ marginTop: 16 }}>
          Balance: <AccountBalances publicKey={props.account.publicKey} testnet={props.account.testnet} />
        </DialogContentText>
        <DialogActions style={{ marginTop: 16 }}>
          <Button color="primary" onClick={props.onClose} style={{ marginRight: 16 }}>
            Cancel
          </Button>
          <Button color="primary" variant="contained" autoFocus onClick={onConfirm}>
            <ButtonIconLabel label="Delete">
              <DeleteIcon />
            </ButtonIconLabel>
          </Button>
        </DialogActions>
      </DialogContent>
    </Dialog>
  )
}

export default AccountDeletionDialog
