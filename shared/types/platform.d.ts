interface TrustedService {
  domain: string
  signingKey: string
}

declare namespace Platform {
  export interface SettingsData {
    agreedToTermsAt?: string
    biometricLock: boolean
    multisignature: boolean
    testnet: boolean
    hideMemos: boolean
  }
}

declare namespace NodeJS {
  interface Process {
    browser?: boolean
  }
}

interface BiometricAvailability {
  available: boolean
  enrolled: boolean
}
