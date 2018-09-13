import { observable, IObservableArray } from "mobx"
import { Asset } from "stellar-sdk"
import { Account } from "./accounts"

export enum DialogType {
  ChangePassword = "ChangePassword",
  CreateAccount = "CreateAccount",
  CreatePayment = "CreatePayment",
  CustomTrustline = "CustomTrustline",
  DeleteAccount = "DeleteAccount",
  ExportKey = "ExportKey",
  RemoveTrustline = "RemoveTrustline",
  Rename = "Rename"
}

export type DialogDescriptor =
  | CustomTrustlineDescriptor
  | ChangePasswordDescriptor
  | CreateAccountDescriptor
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

export interface ChangePasswordDescriptor extends DialogDescriptorBase {
  type: DialogType.ChangePassword
  props: {
    account: Account
  }
}

export interface CreatePaymentDescriptor extends DialogDescriptorBase {
  type: DialogType.CreatePayment
  props: {
    account: Account
  }
}

export interface CreateAccountDescriptor extends DialogDescriptorBase {
  type: DialogType.CreateAccount
  props: {
    testnet: boolean
  }
}

export interface CustomTrustlineDescriptor extends DialogDescriptorBase {
  type: DialogType.CustomTrustline
  props: {
    account: Account
  }
}

export interface DeleteAccountDescriptor extends DialogDescriptorBase {
  type: DialogType.DeleteAccount
  props: {
    account: Account
    onDeleted: () => void
  }
}

export interface ExportKeyDescriptor extends DialogDescriptorBase {
  type: DialogType.ExportKey
  props: {
    account: Account
  }
}

export interface RemoveTrustlineDescriptor extends DialogDescriptorBase {
  type: DialogType.RemoveTrustline
  props: {
    account: Account
    asset: Asset
  }
}

export interface RenameDescriptor extends DialogDescriptorBase {
  type: DialogType.Rename
  props: {
    performRenaming: (newValue: string) => Promise<void>
    prevValue: string
    title: string
  }
}

const DialogStore: IObservableArray<DialogDescriptor> = observable([])

export default DialogStore

let nextID = 1

export function createDialog<Props extends {}>(type: DialogType, props: Props) {
  return {
    id: nextID++,
    open: true,
    props,
    type: type as any // To prevent type error that is due to inprecise type inference
  }
}

export function openDialog<DialogProps extends { type: string }>(dialog: DialogDescriptor) {
  DialogStore.push(dialog)
}

export function closeDialog(id: number) {
  const dialog = DialogStore.find(someDialog => someDialog.id === id)
  DialogStore.remove(dialog as DialogDescriptor)
}
