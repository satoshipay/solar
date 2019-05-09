/*
 * This code will be run with elevated privileges in the mobile apps.
 * Wire-up cordova plugins with window.postMessage()-based IPC here.
 */

import { trackError } from "./error"
import { handleMessageEvent, registerCommandHandler, commands } from "./ipc"
import initializeQRReader from "./qr-reader"
import { initSecureStorage, storeKeys } from "./storage"
import { bioAuthenticate, isBiometricAuthAvailable } from "./bio-auth"

const iframe = document.getElementById("walletframe") as HTMLIFrameElement
const showSplashScreenOnIOS = () => (process.env.PLATFORM === "ios" ? navigator.splashscreen.show() : undefined)

let bioAuthInProgress: Promise<void> | undefined
let bioAuthAvailablePromise: Promise<boolean>
let clientSecretPromise: Promise<string>
let isBioAuthAvailable = false

let lastAuthenticationTimestamp: number = 0

const iframeReady = new Promise<void>(resolve => {
  const handler = (event: MessageEvent) => {
    if (event.data === "app:ready") {
      resolve()
      window.removeEventListener("message", handler)
    }
  }
  window.addEventListener("message", handler, false)
})

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

  document.addEventListener("backbutton", () => contentWindow.postMessage("app:backbutton", "*"), false)
  document.addEventListener("pause", () => onPause(contentWindow), false)
  document.addEventListener("resume", () => onResume(contentWindow), false)

  bioAuthAvailablePromise = isBiometricAuthAvailable()

  Promise.resolve().then(async () => {
    isBioAuthAvailable = await bioAuthAvailablePromise
    if (isBioAuthAvailable) {
      clientSecretPromise = getClientSecret(contentWindow)
      await authenticate(contentWindow)
    } else {
      await iframeReady
      navigator.splashscreen.hide()
      hideHtmlSplashScreen(contentWindow)
    }
  })
}

function getClientSecret(contentWindow: Window) {
  return new Promise<string>((resolve, reject) => {
    initializeStorage(contentWindow).then(secureStorage => secureStorage.get(resolve, reject, storeKeys.clientSecret))
  })
}

function authenticate(contentWindow: Window) {
  if (bioAuthInProgress) {
    // Make sure we don't call bioAuthenticate() twice in a row
    // Might otherwise happen, since Android likes to trigger the `resume` event on app start
    return bioAuthInProgress
  }

  showHtmlSplashScreen(contentWindow)

  // Trigger show and instantly hide. There will be a fade-out.
  // We show the native splashscreen, because it can be made visible synchronously
  showSplashScreenOnIOS()
  iframeReady.then(() => navigator.splashscreen.hide())

  const performAuth = async (): Promise<void> => {
    const clientSecret = await clientSecretPromise
    try {
      await bioAuthenticate(clientSecret)
      lastAuthenticationTimestamp = Date.now()
    } catch (error) {
      // Just start over if auth fails - Block user interactions until auth is done
      return performAuth()
    }
    await iframeReady
    hideHtmlSplashScreen(contentWindow)
  }

  const onCompletion = () => {
    bioAuthInProgress = undefined
  }

  bioAuthInProgress = performAuth().then(onCompletion, onCompletion)
  return bioAuthInProgress
}

function showHtmlSplashScreen(contentWindow: Window) {
  contentWindow.postMessage(commands.showSplashScreen, "*")
}

function hideHtmlSplashScreen(contentWindow: Window) {
  contentWindow.postMessage(commands.hideSplashScreen, "*")
}

function onPause(contentWindow: Window) {
  contentWindow.postMessage("app:pause", "*")

  if (isBioAuthAvailable) {
    showSplashScreenOnIOS()
    showHtmlSplashScreen(contentWindow)
  }
}

function onResume(contentWindow: Window) {
  contentWindow.postMessage("app:resume", "*")

  // Necessary because the 'use backup' option of the fingerprint dialog triggers onpause/onresume
  if (isBioAuthAvailable && Date.now() - lastAuthenticationTimestamp > 750) {
    authenticate(contentWindow)
  }
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
