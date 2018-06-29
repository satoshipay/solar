import { observable, IObservableArray } from 'mobx'
import { Account } from './accounts'

export enum OverlayTypes {
  CreateAccount = 'CreateAccount',
  CreatePayment = 'CreatePayment',
  Rename = 'Rename'
}

export type Overlay = CreateAccountOverlay | CreatePaymentOverlay | RenameOverlay

interface OverlayBase {
  id: number,
  open: boolean,
  type: OverlayTypes,
  props: any
}

export interface CreatePaymentOverlay extends OverlayBase {
  type: OverlayTypes.CreatePayment,
  props: {
    account: Account
  }
}

export interface CreateAccountOverlay extends OverlayBase {
  type: OverlayTypes.CreateAccount,
  props: {
    testnet: boolean
  }
}

export interface RenameOverlay extends OverlayBase {
  type: OverlayTypes.Rename,
  props: {
    performRenaming: (newValue: string) => void,
    prevValue: string,
    title: string
  }
}

const OverlayStore: IObservableArray<Overlay> = observable([])

export default OverlayStore

let nextID = 1

export function createOverlay<Props extends {}> (type: OverlayTypes, props: Props) {
  return {
    id: nextID++,
    open: true,
    props,
    type: type as any     // To prevent type error that is due to inprecise type inference
  }
}

export function openOverlay<OverlayProps extends { type: string }> (overlay: Overlay) {
  OverlayStore.push(overlay)
}

export function closeOverlay (id: number) {
  const overlay = OverlayStore.find(someOverlay => someOverlay.id === id)
  OverlayStore.remove(overlay)
}
