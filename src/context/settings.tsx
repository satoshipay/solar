import React from "react"
import { loadSettings, saveSettings, SettingsData } from "../platform/settings"
import { addError } from "./notifications"

interface Props {
  children: React.ReactNode
}

interface ContextValue {
  multiSignature: boolean
  multiSignatureServiceURL: string
  showTestnet: boolean
  toggleMultiSignature: () => void
  toggleTestnet: () => void
}

const initialSettings: SettingsData = {
  multisignature: false,
  testnet: false,
  ...loadSettings()
}

const multiSignatureServiceURL =
  process.env.MULTISIG_SERVICE || "https://api-dev.satoshipay.io/staging/signature-coordinator/"

const SettingsContext = React.createContext<ContextValue>({
  multiSignature: initialSettings.multisignature,
  multiSignatureServiceURL,
  showTestnet: initialSettings.testnet,
  toggleMultiSignature: () => undefined,
  toggleTestnet: () => undefined
})

export class SettingsProvider extends React.Component<Props, SettingsData> {
  state: SettingsData = initialSettings

  updateSettings = (update: Pick<SettingsData, "multisignature"> | Pick<SettingsData, "testnet">) => {
    try {
      const updatedSettings = {
        ...this.state,
        ...update
      }
      this.setState(updatedSettings)
      saveSettings(updatedSettings)
    } catch (error) {
      addError(error)
    }
  }

  toggleMultiSignature = () => {
    this.updateSettings({ multisignature: !this.state.multisignature })
  }

  toggleTestnet = () => {
    this.updateSettings({ testnet: !this.state.testnet })
  }

  render() {
    const contextValue: ContextValue = {
      multiSignature: this.state.multisignature,
      multiSignatureServiceURL,
      showTestnet: this.state.testnet,
      toggleMultiSignature: this.toggleMultiSignature,
      toggleTestnet: this.toggleTestnet
    }
    return <SettingsContext.Provider value={contextValue}>{this.props.children}</SettingsContext.Provider>
  }
}

export const SettingsConsumer = SettingsContext.Consumer

export { ContextValue as SettingsContext }
