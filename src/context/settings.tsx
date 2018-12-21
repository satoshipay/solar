import React, { useState } from "react"
import { loadSettings, saveSettings, SettingsData } from "../platform/settings"
import { trackError } from "./notifications"

interface Props {
  children: React.ReactNode
}

interface ContextType {
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

const SettingsContext = React.createContext<ContextType>({
  multiSignature: initialSettings.multisignature,
  multiSignatureServiceURL,
  showTestnet: initialSettings.testnet,
  toggleMultiSignature: () => undefined,
  toggleTestnet: () => undefined
})

export function SettingsProvider(props: Props) {
  const [settings, setSettings] = useState(initialSettings)

  const updateSettings = (update: Pick<SettingsData, "multisignature"> | Pick<SettingsData, "testnet">) => {
    try {
      const updatedSettings = {
        ...settings,
        ...update
      }
      setSettings(updatedSettings)
      saveSettings(updatedSettings)
    } catch (error) {
      trackError(error)
    }
  }

  const toggleMultiSignature = () => updateSettings({ multisignature: !settings.multisignature })
  const toggleTestnet = () => updateSettings({ testnet: !settings.testnet })

  const contextValue: ContextType = {
    multiSignature: settings.multisignature,
    multiSignatureServiceURL,
    showTestnet: settings.testnet,
    toggleMultiSignature,
    toggleTestnet
  }

  return <SettingsContext.Provider value={contextValue}>{props.children}</SettingsContext.Provider>
}

export const SettingsConsumer = SettingsContext.Consumer

export { ContextType as SettingsContextType, SettingsContext }
