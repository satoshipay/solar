export function registerURLHandler(contentWindow: Window, iframeReady: Promise<void>) {
  window.handleOpenURL = handleOpenURL(contentWindow, iframeReady)
}

const handleOpenURL = (contentWindow: Window, iframeReady: Promise<void>) => (url: string) => {
  iframeReady.then(() => {
    contentWindow.postMessage({ messageType: IPC.Messages.DeepLinkURL, url }, "*")
  })
}
