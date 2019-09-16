import React from "react"
import { useRouter } from "../hooks/userinterface"
import { routeUp } from "../routes"

function AndroidBackButton() {
  const router = useRouter()

  React.useEffect(() => {
    const listener = (event: Event) => {
      if (event instanceof MessageEvent && event.data === "app:backbutton") {
        router.history.push(routeUp(router.history.location.pathname))
      }
    }

    window.addEventListener("message", listener, false)
    const unsubscribe = () => window.removeEventListener("message", listener)
    return unsubscribe
  })

  return null
}

export default AndroidBackButton
