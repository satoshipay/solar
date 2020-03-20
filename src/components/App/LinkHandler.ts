import React from "react"
import { Messages } from "../../../shared/ipc"
import { call } from "../../platform/ipc"

function LinkHandler() {
  React.useEffect(() => {
    const listener = (event: Event) => {
      const link = event.target as Element | null
      if (link && link.tagName === "A" && link.getAttribute("href")) {
        const href = link.getAttribute("href") as string
        event.preventDefault()

        call(Messages.OpenLink, href)
      }
    }

    document.body.addEventListener("click", listener)

    const unsubscribe = () => document.body.removeEventListener("click", listener)
    return unsubscribe
  })

  return null
}

export default LinkHandler
