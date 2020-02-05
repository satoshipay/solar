let nextCallID = 1

export function call<Message extends keyof IPC.MessageType>(
  messageType: Message,
  ...args: IPC.MessageArgs<Message>
): Promise<IPC.MessageReturnType<Message>> {
  const callID = nextCallID++

  const responsePromise = new Promise<IPC.MessageReturnType<Message>>((resolve, reject) => {
    const eventListener = (event: Event) => {
      if (event instanceof MessageEvent && event.source === window.parent) {
        const message = event.data
        if (
          !message ||
          typeof message !== "object" ||
          message.callID !== callID ||
          message.messageType !== messageType
        ) {
          return
        }

        unsubscribe()

        if ("error" in message && message.error) {
          reject(Object.assign(Error(message.error.message), { name: message.error.name }))
        } else {
          resolve((message as any).result)
        }
      }
    }

    window.addEventListener("message", eventListener)
    const unsubscribe = () => window.removeEventListener("message", eventListener)

    window.parent.postMessage({ messageType, args, callID }, "*")
  })
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
        callback(event.data.result)
      }
    }
  }

  window.addEventListener("message", eventListener)

  return () => window.removeEventListener("message", eventListener)
}
