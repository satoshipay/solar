import { observable, IObservableArray } from 'mobx'
import { Wallet } from './wallets'

export enum OverlayTypes {
  CreatePayment = 'CreatePayment'
}

export type Overlay = CreatePaymentOverlay  // concatenate with '|'  when adding more overlay types

export interface CreatePaymentOverlay {
  id: number,
  open: boolean,
  type: OverlayTypes.CreatePayment,
  props: {
    wallet: Wallet
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
    type
  }
}

export function openOverlay<OverlayProps extends { type: string }> (overlay: Overlay) {
  OverlayStore.push(overlay)
}

export function closeOverlay (id: number) {
  const overlay = OverlayStore.find(someOverlay => someOverlay.id === id)
  OverlayStore.remove(overlay)
}
