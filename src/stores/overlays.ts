import { observable, IObservableArray } from 'mobx'
import { Wallet } from './wallets'

export enum OverlayTypes {
  CreatePayment = 'CreatePayment',
  CreateWallet = 'CreateWallet'
}

export type Overlay = CreatePaymentOverlay | CreateWalletOverlay

interface OverlayBase {
  id: number,
  open: boolean,
  type: OverlayTypes,
  props: any
}

export interface CreatePaymentOverlay extends OverlayBase {
  type: OverlayTypes.CreatePayment,
  props: {
    wallet: Wallet
  }
}

export interface CreateWalletOverlay extends OverlayBase {
  type: OverlayTypes.CreateWallet,
  props: {
    testnet: boolean
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
