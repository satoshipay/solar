import React from "react"
import { Account } from "../../stores/accounts"
import {
  closeDialog,
  createDialog,
  CreateAccountDescriptor,
  CreatePaymentDescriptor,
  DialogDescriptor,
  DialogType,
  DeleteAccountDescriptor,
  RenameDescriptor
} from "../../stores/dialogs"
import AccountDeletionDialog from "./AccountDeletion"
import CreateAccountDialog from "./CreateAccount"
import CreatePaymentDialog from "./CreatePayment"
import RenameDialog from "./Rename"

const OpenDialog = (props: DialogDescriptor) => {
  const dialog = props
  const onClose = () => closeDialog(dialog.id)

  switch (dialog.type) {
    case DialogType.CreateAccount:
      return (
        <CreateAccountDialog
          {...dialog.props}
          open={dialog.open}
          onClose={onClose}
        />
      )
    case DialogType.CreatePayment:
      return (
        <CreatePaymentDialog
          {...dialog.props}
          open={dialog.open}
          onClose={onClose}
        />
      )
    case DialogType.DeleteAccount:
      return (
        <AccountDeletionDialog
          {...dialog.props}
          open={dialog.open}
          onClose={onClose}
        />
      )
    case DialogType.Rename:
      return (
        <RenameDialog {...dialog.props} open={dialog.open} onClose={onClose} />
      )
    default:
      throw new Error(
        `OpenDialog: Cannot render dialog with unknown type "${
          (dialog as any).type
        }".`
      )
  }
}

export default OpenDialog

export function createAccountCreationDialog(
  testnet: boolean
): CreateAccountDescriptor {
  return createDialog(DialogType.CreateAccount, { testnet })
}

export function createAccountDeletionDialog(
  account: Account,
  onDeleted: () => void
): DeleteAccountDescriptor {
  return createDialog(DialogType.DeleteAccount, { account, onDeleted })
}

export function createPaymentDialog(account: Account): CreatePaymentDescriptor {
  return createDialog(DialogType.CreatePayment, { account })
}

export function createRenamingDialog(
  title: string,
  prevValue: string,
  performRenaming: (newValue: string) => Promise<void>
): RenameDescriptor {
  return createDialog(DialogType.Rename, { performRenaming, prevValue, title })
}
