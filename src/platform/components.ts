import React from "react"

interface QRReaderProps {
  onError: (error: Error) => void
  onScan: (data: string | null) => void
  style?: any // ignored
}

function getImplementation() {
  if (window.electron) {
    const implementation = require("./components.electron")
    return implementation
  } else if (process.env.PLATFORM === "android" || process.env.PLATFORM === "ios") {
    const implementation = require("./components.cordova")
    return implementation
  } else if (process.browser) {
    const implementation = require("./components.web")
    return implementation
  } else {
    throw new Error("There are no platform components for your platform.")
  }
}

const components: any = getImplementation()

export const isFullscreenQRPreview: boolean = components.isFullscreenQRPreview

export const QRReader: React.ComponentType<QRReaderProps> = components.QRReader
