import React from "react"

interface Props {
  children: React.ReactNode
}

interface State {
  multiSignature: boolean
  showTestnet: boolean
}

interface ContextValue extends State {
  toggleMultiSignature: () => void
  toggleTestnet: () => void
}

const SettingsContext = React.createContext<ContextValue>({
  multiSignature: false,
  showTestnet: false,
  toggleMultiSignature: () => undefined,
  toggleTestnet: () => undefined
})

export class SettingsProvider extends React.Component<Props, State> {
  state: State = {
    multiSignature: false,
    showTestnet: false
  }

  toggleMultiSignature = () => {
    this.setState({ multiSignature: !this.state.multiSignature })
  }

  toggleTestnet = () => {
    this.setState({ showTestnet: !this.state.showTestnet })
  }

  render() {
    const contextValue: ContextValue = {
      multiSignature: this.state.multiSignature,
      showTestnet: this.state.showTestnet,
      toggleMultiSignature: this.toggleMultiSignature,
      toggleTestnet: this.toggleTestnet
    }
    return <SettingsContext.Provider value={contextValue}>{this.props.children}</SettingsContext.Provider>
  }
}

export const SettingsConsumer = SettingsContext.Consumer

export { ContextValue as SettingsContext }
