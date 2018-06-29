import React from 'react'
import { closeOverlay, Overlay, OverlayTypes } from '../../stores/overlays'
import CreateAccountDialog from './CreateAccount'
import CreatePaymentOverlay from './CreatePayment'
import RenameDialog from './Rename'

const Overlay = (overlay: Overlay) => {
  switch (overlay.type) {
    case OverlayTypes.CreateAccount:
      return <CreateAccountDialog {...overlay.props} open={overlay.open} onClose={() => closeOverlay(overlay.id)} />
    case OverlayTypes.CreatePayment:
      return <CreatePaymentOverlay {...overlay.props} open={overlay.open} onClose={() => closeOverlay(overlay.id)} />
    case OverlayTypes.Rename:
      return <RenameDialog {...overlay.props} open={overlay.open} onClose={() => closeOverlay(overlay.id)} />
    default:
      throw new Error(`Overlay: Cannot render overlay with unknown type "${(overlay as any).type}".`)
  }
}

export default Overlay
