import React from "react"
import { DialogDescriptor, DialogBlueprint } from "./dialogTypes"

interface ContextValue {
  dialogs: DialogDescriptor[]
  closeDialog: (dialogID: number) => void
  openDialog: (blueprint: DialogBlueprint) => void
}

interface Props {
  children: React.ReactNode
}

interface State {
  dialogs: DialogDescriptor[]
}

const DialogsContext = React.createContext<ContextValue>({
  dialogs: [],
  closeDialog: () => undefined,
  openDialog: () => undefined
})

export class DialogsProvider extends React.Component<Props, State> {
  // Not in the state, since updates using `this.setState()` would be performed asyncronously
  nextID = 1

  state: State = {
    dialogs: []
  }

  openDialog = (blueprint: DialogBlueprint) => {
    const newDialog: DialogDescriptor = {
      id: this.nextID++,
      open: true,
      props: blueprint.props as any, // To prevent type error that is due to inprecise type inference
      type: blueprint.type as any
    }
    this.setState(state => ({
      dialogs: state.dialogs.concat([newDialog])
    }))
  }

  closeDialog = (dialogID: number) => {
    this.setState(state => ({
      dialogs: state.dialogs.filter(someDialog => someDialog.id !== dialogID)
    }))
  }

  render() {
    const contextValue: ContextValue = {
      dialogs: this.state.dialogs,
      closeDialog: this.closeDialog,
      openDialog: this.openDialog
    }
    return <DialogsContext.Provider value={contextValue}>{this.props.children}</DialogsContext.Provider>
  }
}

export const DialogsConsumer = DialogsContext.Consumer

export { ContextValue as DialogsContext }
