import React from "react"
import { DialogDescriptor, DialogType } from "../../context/dialogTypes"
import AccountDeletionDialog from "./AccountDeletion"
import ChangePasswordDialog from "./ChangePassword"
import ExportKeyDialog from "./ExportKey"
import RenameDialog from "./Rename"

interface Props {
  dialog: DialogDescriptor
  onCloseDialog(dialogID: number): void
}

const OpenDialog = (props: Props) => {
  const dialog = props.dialog
  const onClose = () => props.onCloseDialog(dialog.id)

  switch (dialog.type) {
    case DialogType.ChangePassword:
      return <ChangePasswordDialog {...dialog.props} open={dialog.open} onClose={onClose} />
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
