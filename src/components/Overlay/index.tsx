import React from 'react'
import { closeOverlay, Overlay, OverlayTypes } from '../../stores/overlays'
import CreatePaymentOverlay from './CreatePayment'

const Overlay = ({ id, open, props, type }: Overlay) => {
  switch (type) {
    case OverlayTypes.CreatePayment:
      return <CreatePaymentOverlay {...props} open={open} onClose={() => closeOverlay(id)} />
    default:
      throw new Error(`Overlay: Cannot render overlay with unknown type "${type}".`)
  }
}

export default Overlay
