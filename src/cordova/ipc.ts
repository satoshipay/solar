import { KeyStore } from "key-store"
import { trackError } from "./error"

type CommandHandler = (
  event: MessageEvent,
  contentWindow: Window,
  secureStorage: CordovaSecureStorage,
  keyStore: KeyStore<PrivateKeyData, PublicKeyData>
) => Promise<void>

export interface CommandHandlers {
  [eventName: string]: CommandHandler
}

let commandHandlers: CommandHandlers = {}

export function handleMessageEvent(
  event: Event,
  contentWindow: Window,
  secureStorage: CordovaSecureStorage,
  keyStore: KeyStore<PrivateKeyData, PublicKeyData>
) {
  if (!(event instanceof MessageEvent) || event.source !== contentWindow || typeof event.data !== "object") {
    return
  }

  const messageHandler = commandHandlers[event.data.commandType]

  if (messageHandler) {
    messageHandler(event, contentWindow, secureStorage, keyStore).catch(trackError)
  } else {
    throw Error(
      `No message handler defined for event type "${event.data.commandType}".\n` +
        `Event data: ${JSON.stringify(event.data)}`
    )
  }
}

export function registerCommandHandler(commandName: string, handler: CommandHandler) {
  commandHandlers = {
    ...commandHandlers,
    [commandName]: handler
  }
}

export function sendSuccessResponse(contentWindow: Window, event: MessageEvent, result?: any) {
  contentWindow.postMessage({ messageType: event.data.messageType, callID: event.data.callID, result }, "*")
}

export function sendErrorResponse(contentWindow: Window, event: MessageEvent, error: any) {
  contentWindow.postMessage({ messageType: event.data.messageType, callID: event.data.callID, error }, "*")
}
