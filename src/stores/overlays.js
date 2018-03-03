import { observable } from 'mobx'

const OverlayStore = observable([])

export default OverlayStore

let nextID = 1

export function openOverlay (overlayProps) {
  if (!overlayProps || !overlayProps.type) throw new Error(`Need to pass an overlay type to addOverlay().`)

  OverlayStore.push({
    ...overlayProps,
    id: nextID++,
    open: true
  })
}

export function closeOverlay (id) {
  OverlayStore.remove(OverlayStore.find(overlay => overlay.id === id))
}
