import React, { useRef, useState } from "react"
import { DialogDescriptor, DialogBlueprint } from "./dialogTypes"

interface ContextValue {
  dialogs: DialogDescriptor[]
  closeDialog: (dialogID: number) => void
  openDialog: (blueprint: DialogBlueprint) => void
}

interface Props {
  children: React.ReactNode
}

const DialogsContext = React.createContext<ContextValue>({
  dialogs: [],
  closeDialog: () => undefined,
  openDialog: () => undefined
})

export function DialogsProvider(props: Props) {
  // Not in the state, since state updates would be performed asyncronously
  const nextIDRef = useRef(1)
  const [dialogs, setDialogs] = useState<DialogDescriptor[]>([])

  const openDialog = (blueprint: DialogBlueprint) => {
    const newDialog: DialogDescriptor = {
      id: nextIDRef.current++,
      open: true,
      props: blueprint.props as any, // To prevent type error that is due to inprecise type inference
      type: blueprint.type as any
    }
    setDialogs(prevDialogs => [...prevDialogs, newDialog])
  }

  const closeDialog = (dialogID: number) => {
    setDialogs(prevDialogs => prevDialogs.filter(dialog => dialog.id !== dialogID))
  }

  const contextValue: ContextValue = {
    dialogs,
    closeDialog,
    openDialog
  }
  return <DialogsContext.Provider value={contextValue}>{props.children}</DialogsContext.Provider>
}

export const DialogsConsumer = DialogsContext.Consumer

export { ContextValue as DialogsContextType, DialogsContext }
