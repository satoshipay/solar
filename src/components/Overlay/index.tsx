import React from 'react'
import { closeOverlay, Overlay } from '../../stores/overlays'
import CreatePaymentOverlay from './CreatePayment'
import { overlayTypes } from './types'

const Overlay = ({ type, ...props }: Overlay) => {
  switch (type) {
    case overlayTypes.CreatePayment:
      const OverlayComponent = CreatePaymentOverlay as any as React.ComponentType<any>  // FIXME
      return <OverlayComponent {...props} onClose={() => closeOverlay(props.id)} />
    default:
      throw new Error(`Overlay: Cannot render overlay with unknown type "${type}".`)
  }
}

export default Overlay
