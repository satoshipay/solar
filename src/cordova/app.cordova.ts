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

  document.addEventListener("backbutton", onBackKeyDown, false)

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

function onBackKeyDown() {
  // FIXME: Handle the back button
}
