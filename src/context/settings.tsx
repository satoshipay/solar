import React from "react"
import { useState } from "react"
import {
  loadIgnoredSignatureRequestHashes,
  loadSettings,
  saveIgnoredSignatureRequestHashes,
  saveSettings,
  SettingsData
} from "../platform/settings"
import { trackError } from "./notifications"

interface Props {
  children: React.ReactNode
}

interface ContextType {
  ignoreSignatureRequest: (signatureRequestHash: string) => void
  ignoredSignatureRequests: string[]
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

const initialIgnoredSignatureRequests = loadIgnoredSignatureRequestHashes()

const multiSignatureServiceURL = process.env.MULTISIG_SERVICE || "https://multisig.satoshipay.io/"

const SettingsContext = React.createContext<ContextType>({
  ignoreSignatureRequest: () => undefined,
  ignoredSignatureRequests: initialIgnoredSignatureRequests,
  multiSignature: initialSettings.multisignature,
  multiSignatureServiceURL,
  showTestnet: initialSettings.testnet,
  toggleMultiSignature: () => undefined,
  toggleTestnet: () => undefined
})

export function SettingsProvider(props: Props) {
  const [ignoredSignatureRequests, setIgnoredSignatureRequests] = useState(initialIgnoredSignatureRequests)
  const [settings, setSettings] = useState(initialSettings)

  const ignoreSignatureRequest = (signatureRequestHash: string) => {
    if (ignoredSignatureRequests.indexOf(signatureRequestHash) === -1) {
      const updatedSignatureRequestHashes = [...ignoredSignatureRequests, signatureRequestHash]
      saveIgnoredSignatureRequestHashes(updatedSignatureRequestHashes)
      setIgnoredSignatureRequests(updatedSignatureRequestHashes)
    }
  }

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
    ignoreSignatureRequest,
    ignoredSignatureRequests,
    multiSignature: settings.multisignature,
    multiSignatureServiceURL,
    showTestnet: settings.testnet,
    toggleMultiSignature,
    toggleTestnet
  }

  return <SettingsContext.Provider value={contextValue}>{props.children}</SettingsContext.Provider>
}

export { ContextType as SettingsContextType, SettingsContext }
