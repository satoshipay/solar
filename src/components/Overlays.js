import React from 'react'
import { observer } from 'mobx-react'
import Overlay from './Overlay'

const Overlays = ({ overlays }) => (
  overlays.map(overlay => <Overlay key={overlay.id} {...overlay} />)
)

export default observer(Overlays)
