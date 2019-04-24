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
  initializeIPhoneNotchFix()

  setupLinkListener()

  document.addEventListener("backbutton", event => contentWindow.postMessage({ id: "backbutton" }, "*"), false)
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

function initializeIPhoneNotchFix() {
  if (!device || device.platform !== "iOS") {
    return false
  }
  if (typeof Keyboard === "undefined") {
    throw new Error("This fix depends on 'cordova-plugin-keyboard'!")
  }

  const viewportElement = document.getElementsByName("viewport")[0]
  const defaultContent = viewportElement.getAttribute("content")

  setCover()
  window.addEventListener("keyboardWillShow", setFix)
  window.addEventListener("keyboardWillHide", setCover)

  function setCover() {
    viewportElement.setAttribute("content", `${defaultContent}, viewport-fit=cover`)
  }
  function setFix() {
    viewportElement.setAttribute("content", String(defaultContent))
  }
}

function setupLinkListener() {
  registerCommandHandler(commands.openLink, event => {
    return new Promise(() => {
      const url: string = event.data.url
      openUrl(url)
    })
  })
}

function openUrl(url: string) {
  SafariViewController.isAvailable(available => {
    if (available) {
      SafariViewController.show(
        {
          url,
          tintColor: "#ffffff",
          barColor: "#1c8fea",
          controlTintColor: "#ffffff"
        },
        null,
        null
      )
    }
  })
}
