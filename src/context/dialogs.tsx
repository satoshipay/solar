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
  nextID: number
  dialogs: DialogDescriptor[]
}

const DialogsContext = React.createContext<ContextValue>({
  dialogs: [],
  closeDialog: () => undefined,
  openDialog: () => undefined
})

export class DialogsProvider extends React.Component<Props, State> {
  state: State = {
    nextID: 1,
    dialogs: []
  }

  openDialog = (blueprint: DialogBlueprint) => {
    const newDialog: DialogDescriptor = {
      id: this.state.nextID,
      open: true,
      props: blueprint.props as any, // To prevent type error that is due to inprecise type inference
      type: blueprint.type as any
    }
    this.setState({
      nextID: this.state.nextID + 1,
      dialogs: this.state.dialogs.concat([newDialog])
    })
  }

  closeDialog = (dialogID: number) => {
    this.setState({
      dialogs: this.state.dialogs.filter(someDialog => someDialog.id !== dialogID)
    })
  }

  getContextValue = (): ContextValue => {
    return {
      dialogs: this.state.dialogs,
      closeDialog: this.closeDialog,
      openDialog: this.openDialog
    }
  }

  render() {
    return <DialogsContext.Provider value={this.getContextValue()}>{this.props.children}</DialogsContext.Provider>
  }
}

export const DialogsConsumer = DialogsContext.Consumer
