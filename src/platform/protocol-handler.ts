interface ProtocolHandler {
  subscribeToDeepLinkURLs(callback: (url: string) => void): () => void
}

const implementation = getImplementation()

function getImplementation(): ProtocolHandler {
  if (window.electron) {
    return require("./electron/protocol-handler")
  } else if (process.env.PLATFORM === "android" || process.env.PLATFORM === "ios") {
    return require("./cordova/protocol-handler")
  } else {
    return require("./web/protocol-handler")
  }
}

export const subscribeToDeepLinkURLs = implementation.subscribeToDeepLinkURLs
