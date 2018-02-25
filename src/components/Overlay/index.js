import React from 'react'
import { closeOverlay } from '../../stores/overlays'
import CreatePaymentOverlay from './CreatePayment'

const componentByType = {
  CreatePayment: CreatePaymentOverlay
}

const Overlay = ({ type, ...props }) => {
  if (!componentByType[type]) throw new Error(`Overlay: Cannot render overlay with unknown type "${type}".`)

  const OverlayComponent = componentByType[type]
  return <OverlayComponent {...props} onClose={() => closeOverlay(props.id)} />
}

export default Overlay
