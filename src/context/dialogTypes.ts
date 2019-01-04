/**
 * Type definitions for the different dialogs.
 * Implementations can be found in src/components/Dialog/.
 */

import { Account } from "../context/accounts"

export enum DialogType {
  ChangePassword = "ChangePassword",
  CreatePayment = "CreatePayment",
  DeleteAccount = "DeleteAccount",
  ExportKey = "ExportKey",
  RemoveTrustline = "RemoveTrustline",
  Rename = "Rename"
}

export type DialogBlueprint =
  | ChangePasswordDescriptor
  | CreatePaymentDescriptor
  | DeleteAccountDescriptor
  | ExportKeyDescriptor
  | RenameDescriptor

interface DialogDescriptorBase {
  id: number
  open: boolean
  type: DialogType
  props: any
}

export type DialogDescriptor = DialogDescriptorBase & DialogBlueprint

export interface ChangePasswordDescriptor {
  type: DialogType.ChangePassword
  props: {
    account: Account
  }
}

export interface CreatePaymentDescriptor {
  type: DialogType.CreatePayment
  props: {
    account: Account
  }
}

export interface DeleteAccountDescriptor {
  type: DialogType.DeleteAccount
  props: {
    account: Account
    onDeleted: () => void
  }
}

export interface ExportKeyDescriptor {
  type: DialogType.ExportKey
  props: {
    account: Account
  }
}

export interface RenameDescriptor {
  type: DialogType.Rename
  props: {
    performRenaming: (newValue: string) => Promise<void>
    prevValue: string
    title: string
  }
}
