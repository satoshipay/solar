// Global IPC.* types are defined in types/ipc.d.ts

function getImplementation() {
  if (window.electron) {
    const implementation = require("./ipc.electron")
    return implementation
  } else if (process.env.PLATFORM === "android" || process.env.PLATFORM === "ios") {
    const implementation = require("./ipc.cordova")
    return implementation
  } else if (process.browser) {
    const implementation = require("./ipc.web")
    return implementation
  } else {
    throw new Error("There is no IPC implementation for your platform.")
  }
}

const implementation: any = getImplementation()

export function call<Message extends keyof IPC.MessageType>(
  messageType: Message,
  ...args: IPC.MessageArgs<Message>
): Promise<IPC.MessageReturnType<Message>> {
  return implementation.call(messageType, ...args)
}

type UnsubscribeFn = () => void

export function subscribeToMessages<Message extends keyof IPC.MessageType>(
  messageType: Message,
  callback: (message: any) => void
): UnsubscribeFn {
  return implementation.subscribeToMessages(messageType, callback)
}
