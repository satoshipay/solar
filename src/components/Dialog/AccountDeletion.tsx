import React from 'react'
import Button from '@material-ui/core/Button'
import Dialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import DialogContentText from '@material-ui/core/DialogContentText'
import DialogTitle from '@material-ui/core/DialogTitle'
import { AccountBalance } from '../Balance'
import { deleteAccount, Account } from '../../stores/accounts'

interface Props {
  account: Account,
  open: boolean,
  onClose: () => void,
  onDeleted: () => void
}

const AccountDeletionDialog = (props: Props) => {
  const onConfirm = () => {
    deleteAccount(props.account.id)
    props.onClose()
    props.onDeleted()
  }
  return (
    <Dialog open={props.open} onClose={props.onClose}>
      <DialogTitle>Confirm Account Deletion</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Are you sure you want to delete the account "{props.account.name}"?<br />
          Make sure to backup your private key if there are still funds on the account!
        </DialogContentText>
        <DialogContentText style={{ marginTop: 16 }}>
          Balance: <AccountBalance publicKey={props.account.publicKey} testnet={props.account.testnet} />
        </DialogContentText>
        <DialogActions>
          <Button color='primary' onClick={props.onClose}>
            Cancel
          </Button>
          <Button color='primary' autoFocus onClick={onConfirm}>
            Delete
          </Button>
        </DialogActions>
      </DialogContent>
    </Dialog>
  )
}

export default AccountDeletionDialog
