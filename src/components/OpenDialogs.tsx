import React from "react"
import { useContext } from "react"
import { DialogsContext } from "../context/dialogs"
import OpenDialog from "./Dialog/index"

function OpenDialogs() {
  const { dialogs, closeDialog } = useContext(DialogsContext)
  return (
    <>
      {dialogs.map(dialog => (
        <OpenDialog key={dialog.id} dialog={dialog} onCloseDialog={closeDialog} />
      ))}
    </>
  )
}

export default OpenDialogs
