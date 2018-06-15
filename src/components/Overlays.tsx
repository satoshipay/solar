import React from 'react'
import { observer } from 'mobx-react'
import { Overlay as OverlayRecord } from '../stores/overlays'
import Overlay from './Overlay'

const Overlays = (props: { overlays: OverlayRecord[] }) => {
  return (
    <>
      {props.overlays.map(overlay => <Overlay key={overlay.id} {...overlay} />)}
    </>
  )
}

export default observer(Overlays)
