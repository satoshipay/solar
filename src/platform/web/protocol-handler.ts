export function subscribeToDeepLinkURLs(callback: (url: string) => void) {
  window.navigator.registerProtocolHandler(
    "web+stellar",
    `${window.location.origin}/?uri=%s`,
    "Stellar request handler"
  )

  // check if a stellar uri has been passed already
  const uri = new URLSearchParams(window.location.search).get("uri")
  if (uri) {
    callback(uri)
  }

  // no way to unsubscribe
  return () => undefined
}
