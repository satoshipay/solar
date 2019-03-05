interface Props {
  onError: (error: Error) => void
  onScan: (data: string | null) => void
  style?: any // ignored
}

export default function getQRReader(): React.FunctionComponent<Props> {
  if (process.env.PLATFORM === "android" || process.env.PLATFORM === "ios") {
    const QRReader = require("./cordova/qr-reader").default
    return QRReader
  } else if (window.electron || process.browser) {
    const QRReader = require("./web/qr-reader").default
    return QRReader
  } else {
    throw new Error("There is no implementation for your platform.")
  }
}
