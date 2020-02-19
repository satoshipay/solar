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
  const actionsRef = React.useMemo(
    () => ({
      element: dialogActions,
      update: setDialogActions
    }),
    [dialogActions]
  )

  return actionsRef
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
  }, [forceUpdate, routerContext])

  return routerContext
}
