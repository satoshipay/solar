// Global IPC.* types are defined in types/ipc.d.ts

function getImplementation() {
  if (window.electron) {
    const impl = require("./ipc.electron")
    return impl
  } else if (process.env.PLATFORM === "android" || process.env.PLATFORM === "ios") {
    const impl = require("./ipc.cordova")
    return impl
  } else if (process.browser) {
    const impl = require("./ipc.web")
    return impl
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
