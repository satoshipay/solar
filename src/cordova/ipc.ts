import { trackError } from "./error"
import { KeyStore } from "key-store"

type CommandHandler = (
  event: MessageEvent,
  contentWindow: Window,
  secureStorage: CordovaSecureStorage,
  keyStore: KeyStore<PrivateKeyData, PublicKeyData>
) => Promise<void>

interface CommandHandlers {
  [eventName: string]: CommandHandler
}

// commands
export const commands = {
  getKeyIDsCommand: "keystore:getKeyIDs",
  getPublicKeyDataCommand: "keystore:getPublicKeyData",
  getPrivateKeyDataCommand: "keystore:getPrivateKeyData",
  saveKeyCommand: "keystore:saveKey",
  savePublicKeyDataCommand: "keystore:savePublicKeyData",
  signTransactionCommand: "keystore:signTransaction",
  removeKeyCommand: "keystore:removeKey",

  readSettingsCommand: "storage:settings:read",
  storeSettingsCommand: "storage:settings:store",
  readIgnoredSignatureRequestsCommand: "storage:ignoredSignatureRequests:read",
  storeIgnoredSignatureRequestsCommand: "storage:ignoredSignatureRequests:store",

  testBioAuthCommand: "test:auth",

  openLink: "link:open",

  copyToClipboard: "clipboard:write",
  scanQRCodeCommand: "qr-code:scan",

  showSplashScreen: "splash:show",
  hideSplashScreen: "splash:hide"
}

// event types
export const events = {
  getKeyIDsEvent: "keystore:keyIDs",
  getPublicKeyDataEvent: "keystore:publicKeyData",
  getPrivateKeyDataEvent: "keystore:privateKeyData",
  saveKeyEvent: "keystore:savedKey",
  savePublicKeyDataEvent: "keystore:savedPublicKeyData",
  signTransactionEvent: "keystore:signedTransaction",
  removeKeyEvent: "keystore:removedKey",

  keyResponseEvent: "storage:keys",
  keysStoredEvent: "storage:keys:stored",
  settingsResponseEvent: "storage:settings",
  settingsStoredEvent: "storage:settings:stored",
  ignoredSignatureRequestsResponseEvent: "storage:ignoredSignatureRequests",
  storedIgnoredSignatureRequestsEvent: "storage:ignoredSignatureRequests:stored",

  testBioAuthResponseEvent: "test:auth:result",

  qrcodeResultEvent: "qr-code:result",

  deeplinkURLEvent: "deeplink:url"
}

let commandHandlers: CommandHandlers = {}

export function handleMessageEvent(
  event: Event,
  contentWindow: Window,
  secureStorage: CordovaSecureStorage,
  keyStore: KeyStore<PrivateKeyData, PublicKeyData>
) {
  if (!(event instanceof MessageEvent) || event.source !== contentWindow) {
    return
  }

  const messageHandler = commandHandlers[event.data.commandType]

  if (messageHandler) {
    messageHandler(event, contentWindow, secureStorage, keyStore).catch(trackError)
  } else {
    throw new Error(`No message handler defined for event type "${event.data.commandType}"`)
  }
}

export function registerCommandHandler(commandName: string, handler: CommandHandler) {
  commandHandlers = {
    ...commandHandlers,
    [commandName]: handler
  }
}
