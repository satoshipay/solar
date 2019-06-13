export function subscribeToDeepLinkURLs(callback: (url: string) => void) {
  if (!window.electron) {
    throw new Error("No electron runtime context available.")
  }

  return window.electron.subscribeToIPCMain("deeplink:url", (event, args) => {
    if (args) {
      callback(args)
    }
  })
}
