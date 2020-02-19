import React from "react"
import { useTranslation } from "react-i18next"
import { testBiometricAuth, isBiometricAuthAvailable } from "../platform/bio-auth"
import {
  loadIgnoredSignatureRequestHashes,
  loadSettings,
  saveIgnoredSignatureRequestHashes,
  saveSettings
} from "../platform/settings"
import getUpdater from "../platform/updater"
import { trackError } from "./notifications"

interface Props {
  children: React.ReactNode
}

interface ContextType {
  agreedToTermsAt: string | undefined
  biometricLock: boolean
  biometricAvailability: BiometricAvailability
  confirmToC: () => void
  hideMemos: boolean
  ignoreSignatureRequest: (signatureRequestHash: string) => void
  ignoredSignatureRequests: string[]
  initialized: boolean
  multiSignature: boolean
  multiSignatureServiceURL: string
  setSetting: (key: keyof Platform.SettingsData, value: any) => void
  showTestnet: boolean
  toggleBiometricLock: () => void
  toggleMultiSignature: () => void
  toggleTestnet: () => void
  toggleHideMemos: () => void
  trustedServices: TrustedService[]
  updateAvailable: boolean
}

interface SettingsState extends Platform.SettingsData {
  initialized: boolean
}

const initialSettings: SettingsState = {
  agreedToTermsAt: undefined,
  biometricLock: false,
  hideMemos: false,
  initialized: false,
  multisignature: false,
  testnet: false,
  trustedServices: []
}

const initialIgnoredSignatureRequests: string[] = []

const multiSignatureServiceURL = process.env.MULTISIG_SERVICE || "https://multisig.satoshipay.io/"

const SettingsContext = React.createContext<ContextType>({
  agreedToTermsAt: initialSettings.agreedToTermsAt,
  biometricLock: initialSettings.biometricLock,
  biometricAvailability: { available: false, enrolled: false },
  confirmToC: () => undefined,
  hideMemos: initialSettings.hideMemos,
  ignoreSignatureRequest: () => undefined,
  ignoredSignatureRequests: initialIgnoredSignatureRequests,
  initialized: false,
  multiSignature: initialSettings.multisignature,
  multiSignatureServiceURL,
  setSetting: () => undefined,
  showTestnet: initialSettings.testnet,
  toggleBiometricLock: () => undefined,
  toggleMultiSignature: () => undefined,
  toggleTestnet: () => undefined,
  toggleHideMemos: () => undefined,
  trustedServices: initialSettings.trustedServices,
  updateAvailable: false
})

export function SettingsProvider(props: Props) {
  const [ignoredSignatureRequests, setIgnoredSignatureRequests] = React.useState(initialIgnoredSignatureRequests)
  const [settings, setSettings] = React.useState<SettingsState>(initialSettings)
  const [updateAvailable, setUpdateAvailable] = React.useState(false)
  const [biometricAvailability, setBiometricAvailability] = React.useState<BiometricAvailability>({
    available: false,
    enrolled: false
  })
  const { t } = useTranslation()

  React.useEffect(() => {
    Promise.all([loadIgnoredSignatureRequestHashes(), loadSettings()])
      .then(([loadedSignatureReqHashes, loadedSettings]) => {
        setIgnoredSignatureRequests(loadedSignatureReqHashes)
        setSettings({ ...settings, ...loadedSettings, initialized: true })
      })
      .catch(trackError)

    isBiometricAuthAvailable().then(setBiometricAvailability)
    getUpdater()
      .isUpdateAvailable()
      .then(setUpdateAvailable)

    // Can't really cancel loading the settings
    const unsubscribe = () => undefined
    return unsubscribe
  }, [settings])

  const ignoreSignatureRequest = (signatureRequestHash: string) => {
    if (ignoredSignatureRequests.indexOf(signatureRequestHash) === -1) {
      const updatedSignatureRequestHashes = [...ignoredSignatureRequests, signatureRequestHash]
      saveIgnoredSignatureRequestHashes(updatedSignatureRequestHashes)
      setIgnoredSignatureRequests(updatedSignatureRequestHashes)
    }
  }

  const updateSettings = (update: Partial<Platform.SettingsData>) => {
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
  const toggleHideMemos = () => updateSettings({ hideMemos: !settings.hideMemos })

  const toggleBiometricLock = () => {
    const message = settings.biometricLock
      ? t("app-settings.biometric-lock.prompt.disable")
      : t("app-settings.biometric-lock.prompt.enable")

    testBiometricAuth(message)
      .then(() => updateSettings({ biometricLock: !settings.biometricLock }))
      .catch(trackError)
  }

  const setSetting = (key: keyof Platform.SettingsData, value: any) => {
    const partial: Partial<Platform.SettingsData> = {}
    partial[key] = value
    updateSettings(partial)
  }

  const contextValue: ContextType = {
    agreedToTermsAt: settings.agreedToTermsAt,
    biometricLock: settings.biometricLock,
    biometricAvailability,
    confirmToC,
    hideMemos: settings.hideMemos,
    ignoreSignatureRequest,
    ignoredSignatureRequests,
    initialized: settings.initialized,
    multiSignature: settings.multisignature,
    multiSignatureServiceURL,
    setSetting,
    showTestnet: settings.testnet,
    toggleBiometricLock,
    toggleMultiSignature,
    toggleTestnet,
    toggleHideMemos,
    trustedServices: settings.trustedServices,
    updateAvailable
  }

  return <SettingsContext.Provider value={contextValue}>{props.children}</SettingsContext.Provider>
}

export { ContextType as SettingsContextType, SettingsContext }
