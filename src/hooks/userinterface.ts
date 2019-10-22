import throttle from "lodash.throttle"
import React from "react"
import { __RouterContext, RouteComponentProps } from "react-router"
import useMediaQuery from "@material-ui/core/useMediaQuery"
import { NotificationsContext } from "../context/notifications"
import * as Clipboard from "../platform/clipboard"

export const useIsMobile = () => useMediaQuery("(max-width:600px)")
export const useIsSmallMobile = () => useMediaQuery("(max-width:400px)")

export function useClipboard() {
  const { showError, showNotification } = React.useContext(NotificationsContext)

  return React.useMemo(
    () => ({
      async copyToClipboard(value: string, notificationMessage: string = "Copied to clipboard.") {
        try {
          await Clipboard.copyToClipboard(value)
          showNotification("info", notificationMessage)
        } catch (error) {
          showError(error)
        }
      }
    }),
    [showError, showNotification]
  )
}

export interface RefStateObject {
  element: HTMLElement | null
  update: (element: HTMLElement) => void
}

export function useDialogActions(): RefStateObject {
  const [dialogActions, setDialogActions] = React.useState<HTMLElement | null>(null)
  return {
    element: dialogActions,
    update: setDialogActions
  }
}

// TODO: Get rid of this hook once react-router is shipped with a hook out-of-the-box
export function useRouter<Params = {}>() {
  const routerContext = React.useContext<RouteComponentProps<Params>>(__RouterContext)
  const [updateEnforcementState, setUpdateEnforcementState] = React.useState(0)

  const forceUpdate = () => setUpdateEnforcementState(updateEnforcementState + 1)

  if (!routerContext) {
    throw new Error("useRouter() hook can only be used within a react-router provider.")
  }

  React.useEffect(() => {
    const unsubscribe = routerContext.history.listen(() => forceUpdate())
    return unsubscribe
  }, [routerContext])

  return routerContext
}

function useResizeListener(listener: (event: UIEvent) => void) {
  const throttledListener = throttle(listener, 100)

  React.useEffect(() => {
    window.addEventListener("resize", throttledListener)
    return () => window.removeEventListener("resize", throttledListener)
  }, [])
}

const initialScreenHeight = window.screen.height

// Use together with src/platform/keyboard-hack.ts
function useIphoneKeyboardStatus(): "open" | "closed" | undefined {
  if (process.env.PLATFORM !== "ios") {
    return undefined
  }

  const [, setRerenderCounter] = React.useState(0)

  useResizeListener(() => {
    // force re-render
    setRerenderCounter(counter => counter + 1)
  })

  return window.innerHeight < initialScreenHeight - 100 ? "open" : "closed"
}

export function useDialogActionsPosition(): "fixed-bottom" | "inline" {
  const isSmallScreen = useIsMobile()
  const iphoneKeyboardStatus = useIphoneKeyboardStatus()

  return isSmallScreen && iphoneKeyboardStatus !== "open" ? "fixed-bottom" : "inline"
}
