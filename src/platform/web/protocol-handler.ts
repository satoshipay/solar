export function subscribeToDeepLinkURLs(callback: (url: string) => void) {
  window.navigator.registerProtocolHandler("web+stellar", "http://localhost:3000/#/?uri=%s", "Stellar request handler")

  // checks if the current url has the uri parameter
  const uri = new URLSearchParams(window.location.hash.replace("#/", "")).get("uri")
  if (uri) {
    callback(uri)
  }

  return () => undefined
}
