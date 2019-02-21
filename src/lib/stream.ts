export function createStreamDebouncer<MessageType>() {
  let lastMessageJson = ""
  let lastMessageTime = 0

  const debounceError = (error: Error, handler: (error: Error) => void) => {
    setTimeout(() => {
      if (Date.now() - lastMessageTime > 3000) {
        // Every few seconds there is a new useless error with the same data as the previous.
        // So don't show them if there is a successful message afterwards (stream still seems to work)
        handler(error)
      } else {
        // tslint:disable-next-line:no-console
        console.debug("Account data update stream had an error, but still seems to work fine:", error)
      }
    }, 2500)
  }

  const debounceMessage = (message: MessageType, handler: (message: MessageType) => void) => {
    const serialized = JSON.stringify(message)
    lastMessageTime = Date.now()

    if (serialized !== lastMessageJson) {
      // Deduplicate messages. Every few seconds horizon streams yield a new message with an unchanged value.
      lastMessageJson = serialized
      handler(message)
    }
  }

  return {
    debounceError,
    debounceMessage
  }
}
