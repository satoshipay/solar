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
  React.useEffect(() => {
    // send pause event to signal that streaming errors should not be shown temporarily
    window.postMessage("app:pause", "*")

    call(Messages.ScanQRCode)
      .then(text => {
        window.postMessage("app:resume", "*")
        props.onScan(text)
      })
      .catch(error => {
        window.postMessage("app:resume", "*")
        props.onError(error)
        trackError(error)
      })
  }, [props])
  return null
}

export { isFullscreenQRPreview, CordovaQRReader as QRReader }
