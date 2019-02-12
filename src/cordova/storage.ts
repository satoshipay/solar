/*
 * THIS WILL RUN IN EMULATOR OUTSIDE OF SANDBOXED APP IFRAME!
 */

import { trackError } from "../context/notifications"

// CHANGING THIS IDENTIFIER WILL BREAK BACKWARDS-COMPATIBILITY!
const cordovaSecureStorageName = "solar:keystore"
const keystoreKeyName = "keys"
const settingsKeyName = "settings"
const ignoredSignatureRequestsKeyName = "ignored-signature-requests"

interface CommandHandlers {
  [eventName: string]: (
    event: MessageEvent,
    contentWindow: Window,
    secureStorage: CordovaSecureStorage
  ) => Promise<void>
}

const commandHandlers: CommandHandlers = {
  "storage:keys:read": respondWithKeys,
  "storage:keys:store": updateKeys,
  "storage:settings:read": respondWithSettings,
  "storage:settings:store": updateSettings,
  "storage:ignoredSignatureRequests:read": respondWithIgnoredSignatureRequests,
  "storage:ignoredSignatureRequests:store": updateIgnoredSignatureRequests
}

const handleMessageEvent = (event: Event, secureStorage: CordovaSecureStorage) => {
  if (!(event instanceof MessageEvent)) {
    return
  }
  if (!iframe.contentWindow) {
    // Should never happen...
    throw new Error("iframe.contentWindow is not set.")
  }

  // TODO: Check whether we should double-check event.source/event.origin

  const messageHandler = commandHandlers[event.data.commandType]

  if (messageHandler) {
    messageHandler(event, iframe.contentWindow, secureStorage).catch(trackError)
  } else {
    throw new Error(`No message handler defined for event type "${event.data.commandType}"`)
  }
}

async function respondWithKeys(event: MessageEvent, contentWindow: Window, secureStorage: CordovaSecureStorage) {
  const keys = await getValueFromStorage(secureStorage, keystoreKeyName)
  contentWindow.postMessage({ eventType: "storage:keys", id: event.data.id, keys }, "*")
}

async function updateKeys(event: MessageEvent, contentWindow: Window, secureStorage: CordovaSecureStorage) {
  const keysData = event.data.keys

  if (!keysData || keysData !== "object") {
    throw new Error(`Invalid keys passed: ${keysData}`)
  }

  await saveValueIntoStorage(secureStorage, keystoreKeyName, keysData)
  contentWindow.postMessage({ eventType: "storage:keys:stored", id: event.data.id }, "*")
}

async function respondWithSettings(event: MessageEvent, contentWindow: Window, secureStorage: CordovaSecureStorage) {
  const settings = await getValueFromStorage(secureStorage, settingsKeyName)
  contentWindow.postMessage({ eventType: "storage:settings", id: event.data.id, settings }, "*")
}

async function updateSettings(event: MessageEvent, contentWindow: Window, secureStorage: CordovaSecureStorage) {
  const settings = event.data.settings

  if (!settings || settings !== "object") {
    throw new Error(`Invalid settings passed: ${settings}`)
  }

  await saveValueIntoStorage(secureStorage, settingsKeyName, settings)
  contentWindow.postMessage({ eventType: "storage:settings:stored", id: event.data.id }, "*")
}

async function respondWithIgnoredSignatureRequests(
  event: MessageEvent,
  contentWindow: Window,
  secureStorage: CordovaSecureStorage
) {
  const ignoredSignatureRequests = await getValueFromStorage(secureStorage, ignoredSignatureRequestsKeyName)
  contentWindow.postMessage(
    { eventType: "storage:ignoredSignatureRequests", id: event.data.id, ignoredSignatureRequests },
    "*"
  )
}

async function updateIgnoredSignatureRequests(
  event: MessageEvent,
  contentWindow: Window,
  secureStorage: CordovaSecureStorage
) {
  const ignoredSignatureRequests = event.data.ignoredSignatures

  if (!ignoredSignatureRequests || ignoredSignatureRequests !== "object") {
    throw new Error(`Invalid signatures passed: ${ignoredSignatureRequests}`)
  }

  await saveValueIntoStorage(secureStorage, ignoredSignatureRequestsKeyName, ignoredSignatureRequests)
  contentWindow.postMessage({ eventType: "storage:ignoredSignatureRequests:stored", id: event.data.id }, "*")
}

async function getValueFromStorage(storage: CordovaSecureStorage, keyName: string) {
  return new Promise<object>((resolve, reject) => {
    storage.get(key => resolve(JSON.parse(key)), reject, keyName)
  })
}

async function saveValueIntoStorage(storage: CordovaSecureStorage, keyName: string, value: object) {
  return new Promise((resolve, reject) => {
    storage.set(resolve, reject, keyName, JSON.stringify(value))
  }).catch(trackError)
}

const iframe = document.getElementById("walletframe") as HTMLIFrameElement

export default async function initialize() {
  if (!cordova) {
    throw new Error("No cordova runtime available.")
  }

  const secureStorage = await new Promise<CordovaSecureStorage>((resolve, reject) => {
    const storage: CordovaSecureStorage = new cordova.plugins.SecureStorage(
      () => resolve(storage),
      reject, // might throw error e.g. if no lock screen is set for android
      cordovaSecureStorageName
    )
  })

  iframe.addEventListener("message", event => handleMessageEvent(event, secureStorage))
  return secureStorage
}
