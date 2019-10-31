/*
 * This code will be run with elevated privileges in the mobile apps.
 * Wire-up cordova plugins with window.postMessage()-based IPC here.
 */

import { Messages } from "../shared/ipc"
import { trackError } from "./error"
import { handleMessageEvent, registerCommandHandler, sendSuccessResponse, sendErrorResponse } from "./ipc"
import initializeQRReader from "./qr-reader"
import { getCurrentSettings, initSecureStorage, initKeyStore } from "./storage"
import { bioAuthenticate, isBiometricAuthAvailable } from "./bio-auth"
import { registerURLHandler } from "./protocol-handler"

const iframe = document.getElementById("walletframe") as HTMLIFrameElement

let bioAuthInProgress: Promise<void> | undefined
let bioAuthAvailablePromise: Promise<boolean>
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

  setupLinkListener(contentWindow)
  setupBioAuthAvailableHandler()
  setupBioAuthTestHandler()

  document.addEventListener("backbutton", () => contentWindow.postMessage("app:backbutton", "*"), false)
  document.addEventListener("pause", () => onPause(contentWindow), false)
  document.addEventListener("resume", () => onResume(contentWindow), false)

  bioAuthAvailablePromise = isBiometricAuthAvailable()

  // Need to wait for storage to be initialized or
  // getCurrentSettings() won't be reliable
  initializeStorage(contentWindow)
    .then(async () => {
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

function authenticate(contentWindow: Window) {
  if (bioAuthInProgress) {
    // Make sure we don't call bioAuthenticate() twice in a row
    // Might otherwise happen, since Android likes to trigger the `resume` event on app start
    return bioAuthInProgress
  }

  showHtmlSplashScreen(contentWindow)

  // Trigger show and instantly hide. There will be a fade-out.
  // We show the native splashscreen, because it can be made visible synchronously
  iframeReady.then(() => navigator.splashscreen.hide())

  const performAuth = async (): Promise<void> => {
    try {
      await bioAuthenticate()
      refreshLastNativeInteractionTime()
    } catch (error) {
      // tslint:disable-next-line no-console
      console.error("Biometric auth failed:", error)
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
  contentWindow.postMessage(Messages.ShowSplashScreen, "*")
}

function hideHtmlSplashScreen(contentWindow: Window) {
  contentWindow.postMessage(Messages.HideSplashScreen, "*")
}

function onPause(contentWindow: Window) {
  contentWindow.postMessage("app:pause", "*")

  if (isBioAuthEnabled() && Date.now() - lastNativeInteractionTime > 750) {
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
  registerCommandHandler(Messages.CopyToClipboard, event => {
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

  const initPromise = (async () => {
    try {
      const secureStorage = await initSecureStorage()
      const keyStore = await initKeyStore(secureStorage)

      return [secureStorage, keyStore] as const
    } catch (error) {
      // Assume that it is a 'device not secure' error
      alert(
        "This application requires you to set a PIN or unlock pattern for your device.\n\nPlease retry after setting it up."
      )
      return navigator.app.exitApp()
    }
  })()

  // Add event listener synchronously (!), so it subscribes as early as possible, even before `initPromise` resolves
  window.addEventListener("message", async event => {
    const [secureStorage, keyStore] = await initPromise
    handleMessageEvent(event, contentWindow, secureStorage, keyStore)
  })

  storageInitialization = initPromise.then(([secureStorage]) => secureStorage)
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

  function setCover() {
    viewportElement.setAttribute("content", `${defaultContent}, viewport-fit=cover`)
  }
}

function setupLinkListener(contentWindow: Window) {
  registerCommandHandler(Messages.OpenLink, event => {
    return new Promise(() => {
      const url: string = event.data.url
      openUrl(contentWindow, url)
    })
  })
}

function setupBioAuthTestHandler() {
  const messageHandler = async (event: MessageEvent, contentWindow: Window) => {
    try {
      // refresh before and afterwards to prevent splashscreen issues
      refreshLastNativeInteractionTime()
      await bioAuthenticate()
      refreshLastNativeInteractionTime()
      sendSuccessResponse(contentWindow, event)
    } catch (error) {
      sendErrorResponse(contentWindow, event, error)
    }
  }

  registerCommandHandler(Messages.TestBioAuth, messageHandler)
}

function setupBioAuthAvailableHandler() {
  const messageHandler = async (event: MessageEvent, contentWindow: Window) => {
    const checkAuthAvailability = async () => {
      const authAvailable = await isBiometricAuthAvailable()
      sendSuccessResponse(contentWindow, event, authAvailable)
    }

    if (bioAuthInProgress) {
      // wait for bio auth to finish because the plugin does not resolve both promises
      // if they have to be handled simultaneously
      bioAuthInProgress.then(checkAuthAvailability)
    } else {
      checkAuthAvailability()
    }
  }

  registerCommandHandler(Messages.BioAuthAvailable, messageHandler)
}

function openUrl(contentWindow: Window, url: string) {
  SafariViewController.isAvailable(available => {
    if (available) {
      // Make the app stop all horizon event streams
      contentWindow.postMessage("app:pause", "*")
      refreshLastNativeInteractionTime()

      SafariViewController.show(
        {
          url,
          tintColor: "#ffffff",
          barColor: "#1c8fea",
          controlTintColor: "#ffffff"
        },
        result => {
          refreshLastNativeInteractionTime()

          if (result.event === "closed") {
            // Make the app reset all horizon event streams
            contentWindow.postMessage("app:resume", "*")
          }
        },
        null
      )
    }
  })
}
