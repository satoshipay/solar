interface BarcodeScanner {
  scan(success: (result: BarcodeScanResult) => void, error: (error: any) => void, properties: Object): any
}

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

interface CordovaSecureStorage {
  new (success: () => void, error: (error: any) => void, storage_name: string): CordovaSecureStorage

  get(success: (value: any) => void, error: (error: any) => void, key: string): any
  set(success: (key: any) => void, error: (error: any) => void, key: string, value: string): void
  remove(success: (key: any) => void, error: (error: any) => void, key: string): void
  keys(success: (keys: any) => void, error: (error: any) => void): Array<any>
  clear(success: () => void, error: (error: any) => void): void
}

interface CordovaPlugins {
  barcodeScanner: BarcodeScanner
  clipboard: CordovaClipboard
  SecureStorage: CordovaSecureStorage
}
