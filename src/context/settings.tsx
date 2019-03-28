import React from "react"
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
  agreedToTermsAt: string | undefined
  confirmToC: () => void
  ignoreSignatureRequest: (signatureRequestHash: string) => void
  ignoredSignatureRequests: string[]
  multiSignature: boolean
  multiSignatureServiceURL: string
  showTestnet: boolean
  toggleMultiSignature: () => void
  toggleTestnet: () => void
}

const initialSettings: SettingsData = {
  agreedToTermsAt: undefined,
  multisignature: false,
  testnet: false
}

const initialIgnoredSignatureRequests: string[] = []

const multiSignatureServiceURL = process.env.MULTISIG_SERVICE || "https://multisig.satoshipay.io/"

const SettingsContext = React.createContext<ContextType>({
  agreedToTermsAt: initialSettings.agreedToTermsAt,
  confirmToC: () => undefined,
  ignoreSignatureRequest: () => undefined,
  ignoredSignatureRequests: initialIgnoredSignatureRequests,
  multiSignature: initialSettings.multisignature,
  multiSignatureServiceURL,
  showTestnet: initialSettings.testnet,
  toggleMultiSignature: () => undefined,
  toggleTestnet: () => undefined
})

export function SettingsProvider(props: Props) {
  const [ignoredSignatureRequests, setIgnoredSignatureRequests] = React.useState(initialIgnoredSignatureRequests)
  const [settings, setSettings] = React.useState(initialSettings)

  React.useEffect(() => {
    Promise.all([loadIgnoredSignatureRequestHashes(), loadSettings()])
      .then(([loadedSignatureReqHashes, loadedSettings]) => {
        setIgnoredSignatureRequests(loadedSignatureReqHashes)
        setSettings({ ...settings, ...loadedSettings })
      })
      .catch(trackError)

    // Can't really cancel loading the settings
    const unsubscribe = () => undefined
    return unsubscribe
  }, [])

  const ignoreSignatureRequest = (signatureRequestHash: string) => {
    if (ignoredSignatureRequests.indexOf(signatureRequestHash) === -1) {
      const updatedSignatureRequestHashes = [...ignoredSignatureRequests, signatureRequestHash]
      saveIgnoredSignatureRequestHashes(updatedSignatureRequestHashes)
      setIgnoredSignatureRequests(updatedSignatureRequestHashes)
    }
  }

  const updateSettings = (update: Partial<SettingsData>) => {
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

  const confirmToC = () => updateSettings({ agreedToTermsAt: new Date().toISOString() })
  const toggleMultiSignature = () => updateSettings({ multisignature: !settings.multisignature })
  const toggleTestnet = () => updateSettings({ testnet: !settings.testnet })

  const contextValue: ContextType = {
    agreedToTermsAt: settings.agreedToTermsAt,
    confirmToC,
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
