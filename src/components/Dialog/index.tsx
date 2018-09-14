import React from "react"
import { Asset } from "stellar-sdk"
import { Account } from "../../stores/accounts"
import {
  closeDialog,
  createDialog,
  CustomTrustlineDescriptor,
  ChangePasswordDescriptor,
  CreatePaymentDescriptor,
  DialogDescriptor,
  DialogType,
  DeleteAccountDescriptor,
  RemoveTrustlineDescriptor,
  RenameDescriptor
} from "../../stores/dialogs"
import AccountDeletionDialog from "./AccountDeletion"
import CustomTrustlineDialog from "./CustomTrustline"
import ChangePasswordDialog from "./ChangePassword"
import CreatePaymentDialog from "./CreatePayment"
import ExportKeyDialog from "./ExportKey"
import RemoveTrustlineDialog from "./RemoveTrustline"
import RenameDialog from "./Rename"

const OpenDialog = (props: DialogDescriptor) => {
  const dialog = props
  const onClose = () => closeDialog(dialog.id)

  switch (dialog.type) {
    case DialogType.CustomTrustline:
      return <CustomTrustlineDialog {...dialog.props} open={dialog.open} onClose={onClose} />
    case DialogType.ChangePassword:
      return <ChangePasswordDialog {...dialog.props} open={dialog.open} onClose={onClose} />
    case DialogType.CreatePayment:
      return <CreatePaymentDialog {...dialog.props} open={dialog.open} onClose={onClose} />
    case DialogType.DeleteAccount:
      return <AccountDeletionDialog {...dialog.props} open={dialog.open} onClose={onClose} />
    case DialogType.ExportKey:
      return <ExportKeyDialog {...dialog.props} open={dialog.open} onClose={onClose} />
    case DialogType.RemoveTrustline:
      return <RemoveTrustlineDialog {...dialog.props} open={dialog.open} onClose={onClose} />
    case DialogType.Rename:
      return <RenameDialog {...dialog.props} open={dialog.open} onClose={onClose} />
    default:
      throw new Error(`OpenDialog: Cannot render dialog with unknown type "${(dialog as any).type}".`)
  }
}

export default OpenDialog

export function createCustomTrustlineDialog(account: Account): CustomTrustlineDescriptor {
  return createDialog(DialogType.CustomTrustline, { account })
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

export function createRemoveTrustlineDialog(account: Account, asset: Asset): RemoveTrustlineDescriptor {
  return createDialog(DialogType.RemoveTrustline, { account, asset })
}
