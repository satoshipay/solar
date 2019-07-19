/*
 * This code will be run with elevated privileges in the mobile apps.
 * Wire-up cordova plugins with window.postMessage()-based IPC here.
 */

import { trackError } from "./error"
import { handleMessageEvent, registerCommandHandler, commands, events } from "./ipc"
import initializeQRReader from "./qr-reader"
import { getCurrentSettings, initSecureStorage, storeKeys } from "./storage"
import { bioAuthenticate, isBiometricAuthAvailable } from "./bio-auth"
import { registerURLHandler } from "./protocol-handler"

const iframe = document.getElementById("walletframe") as HTMLIFrameElement
const showSplashScreenOnIOS = () => (process.env.PLATFORM === "ios" ? navigator.splashscreen.show() : undefined)

let bioAuthInProgress: Promise<void> | undefined
let bioAuthAvailablePromise: Promise<boolean>
let clientSecretPromise: Promise<string>
let isBioAuthAvailable = false

let lastNativeInteractionTime: number = 0
let storageInitialization: Promise<CordovaSecureStorage> | undefined

export function refreshLastNativeInteractionTime() {
  lastNativeInteractionTime = Date.now()
}

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

function isBioAuthEnabled() {
  const settings = getCurrentSettings()
  return isBioAuthAvailable && settings && settings.biometricLock
}

function onDeviceReady() {
  const contentWindow = iframe.contentWindow

  if (!cordova) {
    throw new Error("No cordova runtime available.")
  }
  if (!contentWindow) {
    // Should never happen...
    throw new Error("iframe.contentWindow is not set.")
  }

  registerURLHandler(contentWindow, iframeReady)
  initializeQRReader()
  initializeClipboard(cordova)
  initializeIPhoneNotchFix()

  setupLinkListener()
  setupBioAuthTestHandler()

  document.addEventListener("backbutton", () => contentWindow.postMessage("app:backbutton", "*"), false)
  document.addEventListener("pause", () => onPause(contentWindow), false)
  document.addEventListener("resume", () => onResume(contentWindow), false)

  bioAuthAvailablePromise = isBiometricAuthAvailable()

  // Need to wait for storage to be initialized or
  // getCurrentSettings() won't be reliable
  initializeStorage(contentWindow)
    .then(async () => {
      clientSecretPromise = getClientSecret(contentWindow)
      isBioAuthAvailable = await bioAuthAvailablePromise

      if (isBioAuthEnabled()) {
        await authenticate(contentWindow)
      } else {
        await iframeReady
        navigator.splashscreen.hide()
        hideHtmlSplashScreen(contentWindow)
      }
    })
    .catch(trackError)
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
      refreshLastNativeInteractionTime()
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

  if (isBioAuthEnabled() && Date.now() - lastNativeInteractionTime > 750) {
    showSplashScreenOnIOS()
    showHtmlSplashScreen(contentWindow)
  }
}

function onResume(contentWindow: Window) {
  contentWindow.postMessage("app:resume", "*")

  // Necessary because the 'use backup' option of the fingerprint dialog triggers onpause/onresume
  if (isBioAuthEnabled() && Date.now() - lastNativeInteractionTime > 750) {
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
  // Do not try to initialize storage / add message handler twice
  if (storageInitialization) {
    return storageInitialization
  }

  const initPromise = initSecureStorage().catch(
    (): any => {
      // Assume that it is a 'device not secure' error
      alert(
        "This application requires you to set a PIN or unlock pattern for your device.\n\nPlease retry after setting it up."
      )
      navigator.app.exitApp()
    }
  )

  // Set up event listener synchronously, so it's working as early as possible
  window.addEventListener("message", async event => {
    handleMessageEvent(event, contentWindow, await initPromise)
  })

  storageInitialization = initPromise
  return storageInitialization
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

function setupBioAuthTestHandler() {
  const messageHandler = async (event: MessageEvent, contentWindow: Window) => {
    const clientSecret = await clientSecretPromise
    try {
      await bioAuthenticate(clientSecret)
      refreshLastNativeInteractionTime()
      contentWindow.postMessage({ eventType: events.testBioAuthResponseEvent, id: event.data.id }, "*")
    } catch (error) {
      contentWindow.postMessage({ eventType: events.testBioAuthResponseEvent, id: event.data.id, error }, "*")
    }
  }

  registerCommandHandler(commands.testBioAuthCommand, messageHandler)
}

function openUrl(url: string) {
  SafariViewController.isAvailable(available => {
    if (available) {
      refreshLastNativeInteractionTime()
      SafariViewController.show(
        {
          url,
          tintColor: "#ffffff",
          barColor: "#1c8fea",
          controlTintColor: "#ffffff"
        },
        () => refreshLastNativeInteractionTime(),
        null
      )
    }
  })
}
