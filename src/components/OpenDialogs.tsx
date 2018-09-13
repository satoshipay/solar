import React from "react"
import { DialogsConsumer } from "../context/dialogs"
import OpenDialog from "./Dialog/index"

const OpenDialogs = () => {
  return (
    <DialogsConsumer>
      {({ dialogs, closeDialog }) =>
        dialogs.map(dialog => <OpenDialog key={dialog.id} dialog={dialog} onCloseDialog={closeDialog} />)
      }
    </DialogsConsumer>
  )
}

export default OpenDialogs
