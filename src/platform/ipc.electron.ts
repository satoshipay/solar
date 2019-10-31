let nextCallID = 1

export function call<Message extends keyof IPC.MessageType>(
  messageType: Message,
  ...args: IPC.MessageArgs<Message>
): Promise<IPC.MessageReturnType<Message>> {
  const callID = nextCallID++

  window.electron!.sendIPCMessage(messageType, {
    args,
    callID
  })

  return new Promise<IPC.MessageReturnType<Message>>((resolve, reject) => {
    const unsubscribe = window.electron!.subscribeToIPCMessages(messageType, (event: Event, message: any) => {
      // TODO look into this again
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
}

type UnsubscribeFn = () => void

export function subscribeToMessages<Message extends keyof IPC.MessageType>(
  messageType: Message,
  callback: (message: any) => void
): UnsubscribeFn {
  return window.electron!.subscribeToIPCMessages(messageType, (event: Event, message: any) => callback(message))
}
