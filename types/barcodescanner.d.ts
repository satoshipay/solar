interface BarcodeScanner {
  scan(success: (result: ScanResult) => void, error: (error: any) => void, properties: Object): any
}

interface ScanResult {
  text: string
  format: string
  cancelled: boolean
}

interface CordovaPlugins {
  barcodeScanner: BarcodeScanner
}
