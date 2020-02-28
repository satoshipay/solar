// Global IPC.* types are defined in types/ipc.d.ts

import React from "react"
import { Messages } from "../shared/ipc"
import { trackError } from "../context/notifications"
import { call } from "./ipc"

const isFullscreenQRPreview = true

interface Props {
  onError: (error: Error) => void
  onScan: (data: string) => void
  style?: any // ignored
}

function CordovaQRReader(props: Props): ReturnType<React.FunctionComponent<Props>> {
  const { onError, onScan } = props
  React.useEffect(() => {
    // send pause event to signal that streaming errors should not be shown temporarily
    window.postMessage("app:pause", "*")

    call(Messages.ScanQRCode)
      .then(text => {
        window.postMessage("app:resume", "*")
        onScan(text)
      })
      .catch(error => {
        window.postMessage("app:resume", "*")
        onError(error)
        trackError(error)
      })
  }, [onError, onScan])
  return null
}

export { isFullscreenQRPreview, CordovaQRReader as QRReader }
