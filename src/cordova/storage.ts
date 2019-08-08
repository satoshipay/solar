/*
 * THIS WILL RUN IN EMULATOR OUTSIDE OF SANDBOXED APP IFRAME!
 */

import nanoid from "nanoid"
import { commands, events, registerCommandHandler } from "./ipc"
import { SettingsData } from "../platform/types"
import { createStore, KeysData } from "key-store"
import { registerKeyStoreCommandHandlers } from "./keystore"

// CHANGING THIS IDENTIFIER WILL BREAK BACKWARDS-COMPATIBILITY!
const cordovaSecureStorageName = "solar:keystore"

export const storeKeys = {
  keystore: "keys",
  settings: "settings",
  ignoredSignatureRequests: "ignored-signature-requests",
  clientSecret: "clientsecret"
}

registerCommandHandler(commands.readSettingsCommand, respondWithSettings)
registerCommandHandler(commands.storeSettingsCommand, updateSettings)
registerCommandHandler(commands.readIgnoredSignatureRequestsCommand, respondWithIgnoredSignatureRequests)
registerCommandHandler(commands.storeIgnoredSignatureRequestsCommand, updateIgnoredSignatureRequests)

let currentSettings: SettingsData | undefined

export const getCurrentSettings = () => currentSettings

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

  currentSettings = settings
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

async function getValueFromStorage<T = any>(storage: CordovaSecureStorage, keyName: string) {
  return new Promise<T>((resolve, reject) => {
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

  currentSettings = await getValueFromStorage(secureStorage, storeKeys.settings)
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

export async function initKeyStore(secureStorage: CordovaSecureStorage) {
  const initialKeys = await getValueFromStorage(secureStorage, storeKeys.keystore)
  const saveKeys = (keysData: KeysData<PublicKeyData>) => {
    saveValueIntoStorage(secureStorage, storeKeys.keystore, keysData)
  }

  const keyStore = createStore<PrivateKeyData, PublicKeyData>(saveKeys, initialKeys)
  registerKeyStoreCommandHandlers()
  return keyStore
}
