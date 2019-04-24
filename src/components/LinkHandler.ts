import React from "react"
import { sendCommand } from "../platform/cordova/message-handler"
import { commands } from "../cordova/ipc"

function LinkHandler() {
  React.useEffect(() => {
    const listener = (event: Event) => {
      const link = event.target as Element | null
      if (link && link.tagName === "A" && link.getAttribute("href")) {
        const href = link.getAttribute("href") as string
        event.preventDefault()

        sendCommand(commands.openLink, { url: href })
      }
    }

    document.body.addEventListener("click", listener)

    const unsubscribe = () => document.body.removeEventListener("click", listener)
    return unsubscribe
  })

  return null
}

export default LinkHandler
