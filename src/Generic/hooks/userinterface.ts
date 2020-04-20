import React from "react"
import { useTranslation } from "react-i18next"
import { __RouterContext, RouteComponentProps } from "react-router"
import useMediaQuery from "@material-ui/core/useMediaQuery"
import { NotificationsContext } from "~App/contexts/notifications"
import * as Clipboard from "~Platform/clipboard"

export const useIsMobile = () => useMediaQuery("(max-width:600px)")
export const useIsSmallMobile = () => useMediaQuery("(max-width:400px)")

export function useClipboard() {
  const { showError, showNotification } = React.useContext(NotificationsContext)
  const { t } = useTranslation()

  return React.useMemo(
    () => ({
      async copyToClipboard(value: string, notificationMessage?: string) {
        try {
          await Clipboard.copyToClipboard(value)
          const message = notificationMessage ? notificationMessage : t("generic.user-interface.copied-to-clipboard")
          showNotification("info", message)
        } catch (error) {
          showError(error)
        }
      }
    }),
    [showError, showNotification, t]
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

  // eslint-disable-next-line react-hooks/exhaustive-deps
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
