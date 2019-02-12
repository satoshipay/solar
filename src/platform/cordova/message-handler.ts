let nextCommandID = 1

export function sendCommand(commandType: string, data?: any) {
  const id = nextCommandID++
  window.parent.postMessage({ commandType, id, ...data }, "*")

  // is it important to add the eventlistener before posting the message?

  return new Promise<MessageEvent>(resolve => {
    window.addEventListener("message", event => {
      if (event instanceof MessageEvent) {
        if (event.data.id === id) {
          resolve(event)
        }
      }
    })
  })
}
