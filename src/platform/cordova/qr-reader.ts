import React from "react"
import { sendCommand } from "./message-handler"
import { trackError } from "../../context/notifications"
import { commands } from "../../cordova/ipc"

const isFullscreenQRPreview = true

interface Props {
  onError: (error: Error) => void
  onScan: (data: string) => void
  style?: any // ignored
}

function CordovaQRReader(props: Props): ReturnType<React.FunctionComponent<Props>> {
  React.useEffect(() => {
    // send pause event to signal that streaming errors should not be shown temporarily
    window.postMessage("app:pause", "*")

    sendCommand(commands.scanQRCodeCommand)
      .then(event => {
        window.postMessage("app:resume", "*")
        props.onScan(event.data.qrdata)
      })
      .catch(error => {
        window.postMessage("app:resume", "*")
        props.onError(error)
        trackError(error)
      })
  }, [])
  return null
}

export { isFullscreenQRPreview, CordovaQRReader as QRReader }
