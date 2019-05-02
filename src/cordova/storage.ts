/*
 * THIS WILL RUN IN EMULATOR OUTSIDE OF SANDBOXED APP IFRAME!
 */

import nanoid from "nanoid"
import { commands, events } from "./ipc"
import { registerCommandHandler } from "./ipc"

// CHANGING THIS IDENTIFIER WILL BREAK BACKWARDS-COMPATIBILITY!
const cordovaSecureStorageName = "solar:keystore"

export const storeKeys = {
  keystore: "keys",
  settings: "settings",
  ignoredSignatureRequests: "ignored-signature-requests",
  clientSecret: "clientsecret"
}

registerCommandHandler(commands.readKeysCommand, respondWithKeys)
registerCommandHandler(commands.storeKeysCommand, updateKeys)
registerCommandHandler(commands.readSettingsCommand, respondWithSettings)
registerCommandHandler(commands.storeSettingsCommand, updateSettings)
registerCommandHandler(commands.readIgnoredSignatureRequestsCommand, respondWithIgnoredSignatureRequests)
registerCommandHandler(commands.storeIgnoredSignatureRequestsCommand, updateIgnoredSignatureRequests)

async function respondWithKeys(event: MessageEvent, contentWindow: Window, secureStorage: CordovaSecureStorage) {
  const keys = await getValueFromStorage(secureStorage, storeKeys.keystore)
  contentWindow.postMessage({ eventType: events.keyResponseEvent, id: event.data.id, keys }, "*")
}

async function updateKeys(event: MessageEvent, contentWindow: Window, secureStorage: CordovaSecureStorage) {
  const keysData = event.data.keys

  if (!keysData || typeof keysData !== "object") {
    throw new Error(`Invalid keys passed: ${keysData}`)
  }

  await saveValueIntoStorage(secureStorage, storeKeys.keystore, keysData)
  contentWindow.postMessage({ eventType: events.keysStoredEvent, id: event.data.id }, "*")
}

async function respondWithSettings(event: MessageEvent, contentWindow: Window, secureStorage: CordovaSecureStorage) {
  const settings = await getValueFromStorage(secureStorage, storeKeys.settings)
  contentWindow.postMessage({ eventType: events.settingsResponseEvent, id: event.data.id, settings }, "*")
}

async function updateSettings(event: MessageEvent, contentWindow: Window, secureStorage: CordovaSecureStorage) {
  const settings = event.data.settings

  if (!settings || typeof settings !== "object") {
    throw new Error(`Invalid settings passed: ${settings}`)
  }

  await saveValueIntoStorage(secureStorage, storeKeys.settings, settings)
  contentWindow.postMessage({ eventType: events.settingsStoredEvent, id: event.data.id }, "*")
}

async function respondWithIgnoredSignatureRequests(
  event: MessageEvent,
  contentWindow: Window,
  secureStorage: CordovaSecureStorage
) {
  const ignoredSignatureRequests = await getValueFromStorage(secureStorage, storeKeys.ignoredSignatureRequests)
  contentWindow.postMessage(
    { eventType: events.ignoredSignatureRequestsResponseEvent, id: event.data.id, ignoredSignatureRequests },
    "*"
  )
}

async function updateIgnoredSignatureRequests(
  event: MessageEvent,
  contentWindow: Window,
  secureStorage: CordovaSecureStorage
) {
  const ignoredSignatureRequests = event.data.ignoredSignatureRequests

  if (!Array.isArray(ignoredSignatureRequests)) {
    throw new Error(`Expected signature requests to be an array: ${ignoredSignatureRequests}`)
  }

  await saveValueIntoStorage(secureStorage, storeKeys.ignoredSignatureRequests, ignoredSignatureRequests)
  contentWindow.postMessage({ eventType: events.storedIgnoredSignatureRequestsEvent, id: event.data.id }, "*")
}

async function getValueFromStorage(storage: CordovaSecureStorage, keyName: string) {
  return new Promise<object>((resolve, reject) => {
    storage.get(value => resolve(JSON.parse(value)), reject, keyName)
  })
}

async function saveValueIntoStorage(storage: CordovaSecureStorage, keyName: string, value: object) {
  return new Promise((resolve, reject) => {
    storage.set(resolve, reject, keyName, JSON.stringify(value))
  })
}

async function prepareStorage(secureStorage: CordovaSecureStorage) {
  const keys = await new Promise<string[]>((resolve, reject) => {
    secureStorage.keys(result => resolve(result), reject)
  })

  const initializeKeyValueIfNotSet = async (keyName: string, defaultValue: any) => {
    if (keys.indexOf(keyName) === -1) {
      await saveValueIntoStorage(secureStorage, keyName, defaultValue)
    }
  }

  await Promise.all([
    initializeKeyValueIfNotSet(storeKeys.keystore, {}),
    initializeKeyValueIfNotSet(storeKeys.settings, {}),
    initializeKeyValueIfNotSet(storeKeys.ignoredSignatureRequests, []),
    initializeKeyValueIfNotSet(storeKeys.clientSecret, nanoid(32))
  ])
}

export function initSecureStorage() {
  const secureStoragePromise = new Promise<CordovaSecureStorage>((resolve, reject) => {
    const storage: CordovaSecureStorage = new cordova.plugins.SecureStorage(
      () =>
        prepareStorage(storage)
          .then(() => resolve(storage))
          .catch(reject),
      reject, // might throw error e.g. if no lock screen is set for android
      cordovaSecureStorageName
    )
  })

  return secureStoragePromise
}
