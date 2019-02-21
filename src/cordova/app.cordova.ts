import { trackError } from "./error"
import { handleMessageEvent } from "./ipc"
import initializeQRReader from "./qr-reader"
import { initSecureStorage } from "./storage"

const iframe = document.getElementById("walletframe") as HTMLIFrameElement

document.addEventListener("deviceready", onDeviceReady, false)

function onDeviceReady() {
  document.addEventListener("pause", onPause, false)
  document.addEventListener("resume", onResume, false)
  document.addEventListener("backbutton", onBackKeyDown, false)

  initializeStorage().catch(trackError)
  initializeQRReader()
}

function initializeStorage() {
  const contentWindow = iframe.contentWindow

  if (!cordova) {
    throw new Error("No cordova runtime available.")
  }
  if (!contentWindow) {
    // Should never happen...
    throw new Error("iframe.contentWindow is not set.")
  }

  const initPromise = initSecureStorage()

  // Set up event listener synchronously, so it's working as early as possible
  window.addEventListener("message", async event => {
    handleMessageEvent(event, contentWindow, await initPromise)
  })

  return initPromise
}

function onPause() {
  // Handle the pause event
}

function onResume() {
  // Handle the resume event
}

function onBackKeyDown() {
  // Handle the back button
}
