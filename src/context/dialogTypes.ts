import { Asset } from "stellar-sdk"
import { Account } from "../stores/accounts"

export enum DialogType {
  ChangePassword = "ChangePassword",
  CreatePayment = "CreatePayment",
  CustomTrustline = "CustomTrustline",
  DeleteAccount = "DeleteAccount",
  ExportKey = "ExportKey",
  RemoveTrustline = "RemoveTrustline",
  Rename = "Rename"
}

export type DialogBlueprint =
  | CustomTrustlineDescriptor
  | ChangePasswordDescriptor
  | CreatePaymentDescriptor
  | DeleteAccountDescriptor
  | ExportKeyDescriptor
  | RemoveTrustlineDescriptor
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

export interface CustomTrustlineDescriptor {
  type: DialogType.CustomTrustline
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

export interface RemoveTrustlineDescriptor {
  type: DialogType.RemoveTrustline
  props: {
    account: Account
    asset: Asset
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
