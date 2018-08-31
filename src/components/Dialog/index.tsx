import React from "react"
import { Account } from "../../stores/accounts"
import {
  closeDialog,
  createDialog,
  AddTrustlineDescriptor,
  ChangePasswordDescriptor,
  CreateAccountDescriptor,
  CreatePaymentDescriptor,
  DialogDescriptor,
  DialogType,
  DeleteAccountDescriptor,
  RenameDescriptor
} from "../../stores/dialogs"
import AccountDeletionDialog from "./AccountDeletion"
import AddTrustlineDialog from "./AddTrustline"
import ChangePasswordDialog from "./ChangePassword"
import CreateAccountDialog from "./CreateAccount"
import CreatePaymentDialog from "./CreatePayment"
import ExportKeyDialog from "./ExportKey"
import RenameDialog from "./Rename"

const OpenDialog = (props: DialogDescriptor) => {
  const dialog = props
  const onClose = () => closeDialog(dialog.id)

  switch (dialog.type) {
    case DialogType.AddTrustline:
      return <AddTrustlineDialog {...dialog.props} open={dialog.open} onClose={onClose} />
    case DialogType.ChangePassword:
      return <ChangePasswordDialog {...dialog.props} open={dialog.open} onClose={onClose} />
    case DialogType.CreateAccount:
      return <CreateAccountDialog {...dialog.props} open={dialog.open} onClose={onClose} />
    case DialogType.CreatePayment:
      return <CreatePaymentDialog {...dialog.props} open={dialog.open} onClose={onClose} />
    case DialogType.DeleteAccount:
      return <AccountDeletionDialog {...dialog.props} open={dialog.open} onClose={onClose} />
    case DialogType.ExportKey:
      return <ExportKeyDialog {...dialog.props} open={dialog.open} onClose={onClose} />
    case DialogType.Rename:
      return <RenameDialog {...dialog.props} open={dialog.open} onClose={onClose} />
    default:
      throw new Error(`OpenDialog: Cannot render dialog with unknown type "${(dialog as any).type}".`)
  }
}

export default OpenDialog

export function createAddTrustlineDialog(account: Account): AddTrustlineDescriptor {
  return createDialog(DialogType.AddTrustline, { account })
}

export function createAccountCreationDialog(testnet: boolean): CreateAccountDescriptor {
  return createDialog(DialogType.CreateAccount, { testnet })
}

export function createAccountDeletionDialog(account: Account, onDeleted: () => void): DeleteAccountDescriptor {
  return createDialog(DialogType.DeleteAccount, { account, onDeleted })
}

export function createChangeAccountPasswordDialog(account: Account): ChangePasswordDescriptor {
  return createDialog(DialogType.ChangePassword, { account })
}

export function createExportKeyDialog(account: Account): ChangePasswordDescriptor {
  return createDialog(DialogType.ExportKey, { account })
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
