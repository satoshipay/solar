import { trackError } from "./error"
import { registerCommandHandler, sendSuccessResponse } from "./ipc"
import { refreshLastNativeInteractionTime } from "./app.cordova"
import { Messages } from "../shared/ipc"

async function startQRReader(event: MessageEvent, contentWindow: Window) {
  refreshLastNativeInteractionTime()
  cordova.plugins.barcodeScanner.scan(
    result => {
      refreshLastNativeInteractionTime()
      sendSuccessResponse(contentWindow, event, result.text)
    },
    error => {
      refreshLastNativeInteractionTime()
      trackError(error)
    },
    {
      preferFrontCamera: false, // iOS and Android
      showFlipCameraButton: true, // iOS and Android
      showTorchButton: true, // iOS and Android
      torchOn: false, // Android, launch with the torch switched on (if available)
      saveHistory: false, // Android, save scan history (default false)
      prompt: "Place the QR-code inside the scan area", // Android
      resultDisplayDuration: 0, // Android, display scanned text for X ms. 0 suppresses it entirely, default 1500
      formats: "QR_CODE,PDF_417", // default: all but PDF_417 and RSS_EXPANDED
      orientation: "portrait", // Android only (portrait|landscape), default unset so it rotates with the device
      disableAnimations: false, // iOS
      disableSuccessBeep: false // iOS and Android
    }
  )
}

export default function initialize() {
  registerCommandHandler(Messages.ScanQRCode, startQRReader)
}
