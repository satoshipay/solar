interface BarcodeScanner {
  scan(success: (result: BarcodeScanResult) => void, error: (error: any) => void, properties: Object): any
}

declare class Keyboard {}

interface BarcodeScanResult {
  text: string
  format: string
  cancelled: boolean
}

interface CordovaClipboard {
  clear(onSuccess: () => void, onError: (error: Error) => void): void
  copy(text: string, onSuccess: () => void, onError: (error: Error) => void): void
  paste(onSuccess: () => void, onError: (error: Error) => void): void
}

interface CordovaInAppBrowser {
  open(url: string, target?: string, options?: any): void
}

interface CordovaSecureStorage {
  new (success: () => void, error: (error: any) => void, storage_name: string): CordovaSecureStorage

  get(success: (value: any) => void, error: (error: any) => void, key: string): any
  set(success: (key: any) => void, error: (error: any) => void, key: string, value: string): void
  remove(success: (key: any) => void, error: (error: any) => void, key: string): void
  keys(success: (keys: any) => void, error: (error: any) => void): Array<any>
  clear(success: () => void, error: (error: any) => void): void
}

interface SafariViewController {
  isAvailable(available: (available: boolean) => void): void
  show(
    options: SafariViewControllerOptions,
    result: ((result: any) => void) | null,
    message: ((msg: string) => void) | null
  ): void
  hide(): void
}

declare const SafariViewController: SafariViewController

interface SafariViewControllerOptions {
  url: string
  hidden?: boolean
  animated?: boolean
  transition?: string
  enterReaderModeIfAvailable?: boolean
  barColor?: string
  tintColor?: string
  controlTintColor?: string
}

interface Cordova {
  InAppBrowser: InAppBrowser
}

interface Device {
  cordova: string
  available: boolean
  model: string
  platform: string
  uuid: string
  version: string
  manufacturer: string
  isVirtual: boolean
  serial: string
}

declare var device: Device

interface FingerprintOptions {
  clientId: string
  clientSecret?: string
  localizedFallbackTitle?: string
  localizedReason?: string
}

interface Fingerprint {
  isAvailable(success: (result: any) => void, error: (message: any) => void): void
  show(options: FingerprintOptions, success: () => void, error: () => void): void
}

declare var Fingerprint: Fingerprint

interface CordovaPlugins {
  barcodeScanner: BarcodeScanner
  clipboard: CordovaClipboard
  SecureStorage: CordovaSecureStorage
}

interface Navigator {
  splashscreen: {
    hide(): void
    show(): void
  }
  app: {
    exitApp(): never
  }
}
