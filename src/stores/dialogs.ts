import { observable, IObservableArray } from "mobx"
import { Account } from "./accounts"

export enum DialogType {
  AddTrustline = "AddTrustline",
  ChangePassword = "ChangePassword",
  CreateAccount = "CreateAccount",
  CreatePayment = "CreatePayment",
  DeleteAccount = "DeleteAccount",
  ExportKey = "ExportKey",
  Rename = "Rename"
}

export type DialogDescriptor =
  | AddTrustlineDescriptor
  | ChangePasswordDescriptor
  | CreateAccountDescriptor
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

export interface AddTrustlineDescriptor extends DialogDescriptorBase {
  type: DialogType.AddTrustline
  props: {
    account: Account
  }
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
