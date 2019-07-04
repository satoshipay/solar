import { trackError } from "./error"

type CommandHandler = (event: MessageEvent, contentWindow: Window, secureStorage: CordovaSecureStorage) => Promise<void>

interface CommandHandlers {
  [eventName: string]: CommandHandler
}

// commands
export const commands = {
  readKeysCommand: "storage:keys:read",
  storeKeysCommand: "storage:keys:store",
  readSettingsCommand: "storage:settings:read",
  storeSettingsCommand: "storage:settings:store",
  readIgnoredSignatureRequestsCommand: "storage:ignoredSignatureRequests:read",
  storeIgnoredSignatureRequestsCommand: "storage:ignoredSignatureRequests:store",

  openLink: "link:open",

  copyToClipboard: "clipboard:write",
  scanQRCodeCommand: "qr-code:scan",

  showSplashScreen: "splash:show",
  hideSplashScreen: "splash:hide"
}

// event types
export const events = {
  keyResponseEvent: "storage:keys",
  keysStoredEvent: "storage:keys:stored",
  settingsResponseEvent: "storage:settings",
  settingsStoredEvent: "storage:settings:stored",
  ignoredSignatureRequestsResponseEvent: "storage:ignoredSignatureRequests",
  storedIgnoredSignatureRequestsEvent: "storage:ignoredSignatureRequests:stored",

  qrcodeResultEvent: "qr-code:result",

  deeplinkURLEvent: "deeplink:url"
}

let commandHandlers: CommandHandlers = {}

export function handleMessageEvent(event: Event, contentWindow: Window, secureStorage: CordovaSecureStorage) {
  if (!(event instanceof MessageEvent) || event.source !== contentWindow) {
    return
  }

  const messageHandler = commandHandlers[event.data.commandType]

  if (messageHandler) {
    messageHandler(event, contentWindow, secureStorage).catch(trackError)
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
