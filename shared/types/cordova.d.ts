interface BarcodeScanner {
  scan(success: (result: BarcodeScanResult) => void, error: (error: any) => void, properties: Object): any
}

declare const Keyboard: Keyboard

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
  title?: string
  subtitle?: string
  description?: string
  fallbackButtonTitle?: string
  disableBackup?: boolean
  cancelButtonTitle?: string
}

interface Fingerprint {
  isAvailable(success: (result: any) => void, error: (message: any) => void): void
  show(options: FingerprintOptions, success: () => void, error: () => void): void
}

interface LocalNotification {
  actions?: []
  color?: string
  icon?: string
  id?: number
  foreground?: boolean
  led?: boolean
  priority?: number
  silent?: boolean
  smallIcon?: string
  sticky?: boolean
  text: string
  title: string
  vibrate?: boolean
  wakeup?: boolean
}

interface NotificationPlugin {
  local: {
    clear(ids: number[], callback: Function, scope: any): void
    clearAll(callback: Function, scope: any): void
    hasPermission(callback: (granted: boolean) => void, scope?: any): void
    requestPermission(callback: (granted: boolean) => void, scope?: any): void
    schedule(msgs: LocalNotification | LocalNotification[], callback?: Function, scope?: any, args?: any): void
    on(event: string, callback: Function, scope?: any)
    un(event: string, callback: Function, scope?: any)
  }
}

declare var Fingerprint: Fingerprint

interface CordovaPlugins {
  barcodeScanner: BarcodeScanner
  clipboard: CordovaClipboard
  notification: NotificationPlugin
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

interface Window {
  handleOpenURL: (url: string) => void
}
