import { observable, IObservableArray } from 'mobx'

export interface Overlay {
  id: number,
  open: boolean,
  type: string,
  [key: string]: any    // TODO: Instead of allowing dump of custom props here, have `data: any` prop
}

const OverlayStore: IObservableArray<Overlay> = observable([])

export default OverlayStore

let nextID = 1

export function openOverlay<OverlayProps extends { type: string }> (overlayProps: OverlayProps) {
  OverlayStore.push({
    // Reason for `any`: https://stackoverflow.com/q/45268289
    ...(overlayProps as any),
    id: nextID++,
    open: true
  })
}

export function closeOverlay (id: number) {
  const overlay = OverlayStore.find(someOverlay => someOverlay.id === id)
  OverlayStore.remove(overlay)
}
