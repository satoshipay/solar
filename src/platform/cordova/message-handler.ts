let nextCommandID = 1

export function sendCommand(commandType: string, data?: any) {
  const id = nextCommandID++

  const responsePromise = new Promise<MessageEvent>(resolve => {
    window.addEventListener("message", event => {
      if (event instanceof MessageEvent && event.source === window.parent) {
        if (event.data.id === id) {
          resolve(event)
        }
      }
    })
  })

  window.parent.postMessage({ commandType, id, ...data }, "*")

  return responsePromise
}
