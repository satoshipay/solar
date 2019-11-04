let nextCallID = 1

export function call<Message extends keyof IPC.MessageType>(
  messageType: Message,
  ...args: IPC.MessageArgs<Message>
): Promise<IPC.MessageReturnType<Message>> {
  const callID = nextCallID++

  const responsePromise = new Promise<IPC.MessageReturnType<Message>>((resolve, reject) => {
    const unsubscribe = subscribeToMessages(messageType, message => {
      if (!message || typeof message !== "object" || message.callID !== callID) {
        return
      }

      unsubscribe()

      if ("error" in message && message.error) {
        reject(Error(message.error.message))
      } else {
        resolve((message as ElectronIPCCallResultMessage).result)
      }
    })
  })

  window.parent.postMessage({ messageType, args, callID }, "*")

  return responsePromise
}

type UnsubscribeFn = () => void

export function subscribeToMessages<Message extends keyof IPC.MessageType>(
  messageType: Message,
  callback: (message: any) => void
): UnsubscribeFn {
  const eventListener = (event: Event) => {
    if (event instanceof MessageEvent && event.source === window.parent) {
      if (event.data.messageType === messageType) {
        callback(event.data)
      }
    }
  }

  window.addEventListener("message", eventListener)

  return () => window.removeEventListener("message", eventListener)
}
