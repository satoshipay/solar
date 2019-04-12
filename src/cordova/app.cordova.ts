/*
 * This code will be run with elevated privileges in the mobile apps.
 * Wire-up cordova plugins with window.postMessage()-based IPC here.
 */

import { trackError } from "./error"
import { handleMessageEvent, registerCommandHandler, commands } from "./ipc"
import initializeQRReader from "./qr-reader"
import { initSecureStorage } from "./storage"

const iframe = document.getElementById("walletframe") as HTMLIFrameElement

document.addEventListener("deviceready", onDeviceReady, false)

function onDeviceReady() {
  const contentWindow = iframe.contentWindow

  if (!cordova) {
    throw new Error("No cordova runtime available.")
  }
  if (!contentWindow) {
    // Should never happen...
    throw new Error("iframe.contentWindow is not set.")
  }

  initializeStorage(contentWindow).catch(trackError)
  initializeQRReader()
  initializeClipboard(cordova)

  document.addEventListener("backbutton", event => contentWindow.postMessage({ id: "backbutton" }, "*"), false)
  iframe.addEventListener("load", () => setupLinkListeners(contentWindow), false)
}

function initializeClipboard(cordova: Cordova) {
  registerCommandHandler(commands.copyToClipboard, event => {
    return new Promise((resolve, reject) => {
      cordova.plugins.clipboard.copy(event.data.text, resolve, reject)
    })
  })
}

function initializeStorage(contentWindow: Window) {
  const initPromise = initSecureStorage()

  // Set up event listener synchronously, so it's working as early as possible
  window.addEventListener("message", async event => {
    handleMessageEvent(event, contentWindow, await initPromise)
  })

  return initPromise
}

function setupLinkListeners(contentWindow: Window) {
  contentWindow.document.body.addEventListener("click", event => {
    const link = event.target as Element | null
    if (link && link.tagName === "A" && link.getAttribute("href")) {
      const href = link.getAttribute("href") as string
      const target = link.getAttribute("target") || "_self"
      event.preventDefault()
      window.cordova.InAppBrowser.open(href, target === "_blank" ? "_system" : target)
    }
  })
}
