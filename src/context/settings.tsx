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
  biometricLock: boolean
  confirmToC: () => void
  ignoreSignatureRequest: (signatureRequestHash: string) => void
  ignoredSignatureRequests: string[]
  multiSignature: boolean
  multiSignatureServiceURL: string
  showTestnet: boolean
  hideMemos: boolean
  toggleBiometricLock: () => void
  toggleMultiSignature: () => void
  toggleTestnet: () => void
  toggleHideMemos: () => void
}

const initialSettings: SettingsData = {
  agreedToTermsAt: undefined,
  biometricLock: false,
  multisignature: false,
  testnet: false,
  hideMemos: false
}

const initialIgnoredSignatureRequests: string[] = []

const multiSignatureServiceURL = process.env.MULTISIG_SERVICE || "https://multisig.satoshipay.io/"

const SettingsContext = React.createContext<ContextType>({
  agreedToTermsAt: initialSettings.agreedToTermsAt,
  biometricLock: initialSettings.biometricLock,
  confirmToC: () => undefined,
  ignoreSignatureRequest: () => undefined,
  ignoredSignatureRequests: initialIgnoredSignatureRequests,
  multiSignature: initialSettings.multisignature,
  multiSignatureServiceURL,
  showTestnet: initialSettings.testnet,
  hideMemos: initialSettings.hideMemos,
  toggleBiometricLock: () => undefined,
  toggleMultiSignature: () => undefined,
  toggleTestnet: () => undefined,
  toggleHideMemos: () => undefined
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
  const toggleBiometricLock = () => updateSettings({ biometricLock: !settings.biometricLock })
  const toggleMultiSignature = () => updateSettings({ multisignature: !settings.multisignature })
  const toggleTestnet = () => updateSettings({ testnet: !settings.testnet })
  const toggleHideMemos = () => updateSettings({ hideMemos: !settings.hideMemos })

  const contextValue: ContextType = {
    agreedToTermsAt: settings.agreedToTermsAt,
    biometricLock: settings.biometricLock,
    confirmToC,
    ignoreSignatureRequest,
    ignoredSignatureRequests,
    multiSignature: settings.multisignature,
    multiSignatureServiceURL,
    showTestnet: settings.testnet,
    hideMemos: settings.hideMemos,
    toggleBiometricLock,
    toggleMultiSignature,
    toggleTestnet,
    toggleHideMemos
  }

  return <SettingsContext.Provider value={contextValue}>{props.children}</SettingsContext.Provider>
}

export { ContextType as SettingsContextType, SettingsContext }
