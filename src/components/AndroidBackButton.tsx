import React from "react"
import { useRouter } from "../hooks"
import { routeUp } from "../routes"

function AndroidBackButton() {
  const router = useRouter()

  React.useEffect(() => {
    const listener = () => {
      router.history.push(routeUp(router.history.location.pathname))
    }
    document.addEventListener("backbutton", listener, false)
    const unsubscribe = document.removeEventListener("backbutton", listener)
    return unsubscribe
  })

  return null
}

export default AndroidBackButton
