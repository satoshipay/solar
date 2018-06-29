import React from 'react'
import { observer } from 'mobx-react'
import { DialogDescriptor } from '../stores/dialogs'
import OpenDialog from './Dialog/index'

const OpenDialogs = (props: { dialogs: DialogDescriptor[] }) => {
  return (
    <>
      {props.dialogs.map(dialog => <OpenDialog key={dialog.id} {...dialog} />)}
    </>
  )
}

export default observer(OpenDialogs)
