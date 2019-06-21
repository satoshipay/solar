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
  offramp: boolean
  showTestnet: boolean
  toggleBiometricLock: () => void
  toggleMultiSignature: () => void
  toggleOfframp: () => void
  toggleTestnet: () => void
}

const initialSettings: SettingsData = {
  agreedToTermsAt: undefined,
  biometricLock: false,
  multisignature: false,
  offramp: false,
  testnet: false
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
  offramp: initialSettings.offramp,
  showTestnet: initialSettings.testnet,
  toggleBiometricLock: () => undefined,
  toggleMultiSignature: () => undefined,
  toggleOfframp: () => undefined,
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
  const toggleBiometricLock = () => updateSettings({ biometricLock: !settings.biometricLock })
  const toggleMultiSignature = () => updateSettings({ multisignature: !settings.multisignature })
  const toggleOfframp = () => updateSettings({ offramp: !settings.offramp })
  const toggleTestnet = () => updateSettings({ testnet: !settings.testnet })

  const contextValue: ContextType = {
    agreedToTermsAt: settings.agreedToTermsAt,
    biometricLock: settings.biometricLock,
    confirmToC,
    ignoreSignatureRequest,
    ignoredSignatureRequests,
    multiSignature: settings.multisignature,
    multiSignatureServiceURL,
    offramp: settings.offramp,
    showTestnet: settings.testnet,
    toggleBiometricLock,
    toggleMultiSignature,
    toggleOfframp,
    toggleTestnet
  }

  return <SettingsContext.Provider value={contextValue}>{props.children}</SettingsContext.Provider>
}

export { ContextType as SettingsContextType, SettingsContext }
