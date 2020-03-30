import pick from "lodash.pick"

export type CommandHandlers = {
  [eventName in keyof IPC.MessageType]?: IPC.MessageSignatures[eventName]
}

let commandHandlers: CommandHandlers = {}

export async function handleMessageEvent<Message extends keyof IPC.MessageType>(
  messageType: Message,
  payload: ElectronIPCCallMessage<Message>,
  contentWindow: Window
) {
  const { args, callID } = payload

  if (!messageType) {
    throw Error("Missing messageType on call to handleMessageEvent() (defined in ipc.ts)")
  }

  const messageHandler = commandHandlers[messageType]
  if (messageHandler) {
    try {
      const result = await (messageHandler as any)(...args)
      sendSuccessResponse(contentWindow, messageType, callID, result)
    } catch (error) {
      const extras = pick(error, error.__extraProps || [])
      sendErrorResponse(contentWindow, messageType, callID, {
        ...extras,
        __extraProps: error.__extraProps,
        message: error.message,
        name: error.name || "Error",
        stack: error.stack
      })
    }
  } else {
    throw Error(`No message handler defined for event type "${messageType}".\n`)
  }
}

export function expose<Message extends keyof IPC.MessageType>(
  messageType: Message,
  handler: (
    ...args: IPC.MessageArgs<Message>
  ) => IPC.MessageReturnType<Message> | Promise<IPC.MessageReturnType<Message>>
) {
  commandHandlers = {
    ...commandHandlers,
    [messageType]: handler
  }
}

export function sendSuccessResponse(contentWindow: Window, messageType: string, callID: any, result?: any) {
  contentWindow.postMessage({ messageType, callID, result }, "*")
}

export function sendErrorResponse(contentWindow: Window, messageType: string, callID: any, error: any) {
  contentWindow.postMessage({ messageType, callID, error }, "*")
}
