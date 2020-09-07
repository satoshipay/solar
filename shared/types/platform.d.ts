interface TrustedService {
  domain: string
  signingKey: string
}

declare namespace Platform {
  export interface SettingsData {
    agreedToTermsAt?: string
    biometricLock: boolean
    hideMemos: boolean
    multisignature: boolean
    testnet: boolean
    trustedServices: TrustedService[]
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

declare module "stellar-hd-wallet" {
  class StellarHDWallet {
    constructor(seedHex: string)

    static fromMnemonic(mnemonic: string, password?: string, language?: string): StellarHDWallet
    static generateMnemonic(entropyBits?: number, language?: string, rngFn?: Function): string
    static fromSeed(seed: string | Buffer): StellarHDWallet
    static validateMnemonic(mnemonic: string, language?: string): boolean

    getKeypair(index: number): import("stellar-base").Keypair
    getPublicKey(index: number): string
    getSecret(index: number): string
  }

  export default StellarHDWallet
}
