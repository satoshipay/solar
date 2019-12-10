interface QRExports {
  isFullscreenQRPreview: boolean
  QRReader: React.FunctionComponent<QRReaderProps>
}

interface QRReaderProps {
  onError: (error: Error) => void
  onScan: (data: string | null) => void
  style?: any // ignored
}

export default function getQRReader(): QRExports {
  if (process.env.PLATFORM === "android" || process.env.PLATFORM === "ios") {
    return require("./cordova/qr-reader")
  } else if (window.electron || process.browser) {
    return require("./web/qr-reader.tsx")
  } else {
    throw new Error("There is no implementation for your platform.")
  }
}
