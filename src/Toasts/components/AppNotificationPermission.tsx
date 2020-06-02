import React from "react"
import { useTranslation } from "react-i18next"
import Grow from "@material-ui/core/Grow"
import SnackbarContent from "@material-ui/core/SnackbarContent"
import { useTheme } from "@material-ui/core/styles"
import NotificationsIcon from "@material-ui/icons/Notifications"
import { NotificationsContext, trackError } from "~App/contexts/notifications"
import {
  hasPermission as hasPermissionToNotify,
  requestPermission as requestPermissionToNotify,
  showNotification
} from "~Platform/notifications"
import { HorizontalLayout } from "~Layout/components/Box"

interface PermissionNotificationProps {
  onHide: () => void
  open: boolean
}

const PermissionNotification = React.memo(function PermissionNotification(props: PermissionNotificationProps) {
  const { onHide } = props
  const Notifications = React.useContext(NotificationsContext)
  const theme = useTheme()
  const { t } = useTranslation()

  const requestPermission = React.useCallback(() => {
    ;(async () => {
      const granted = await requestPermissionToNotify()
      onHide()

      if (granted) {
        showNotification({
          title: t("app.notification.permission.app-notification.granted.title"),
          text: t("app.notification.permission.app-notification.granted.text")
        })
      } else {
        Notifications.showNotification("error", t("app.notification.permission.app-notification.error"))
      }
    })().catch(trackError)
  }, [Notifications, onHide, t])

  return (
    <Grow in={props.open}>
      <SnackbarContent
        message={
          <HorizontalLayout alignItems="center">
            <NotificationsIcon />
            <span style={{ ...theme.typography.button, marginLeft: 8 }}>
              {t("app.notification.permission.app-notification.message")}
            </span>
          </HorizontalLayout>
        }
        onClick={requestPermission}
        style={{
          display: "flex",
          alignItems: "center",
          background: "white",
          color: theme.palette.text.primary,
          cursor: "pointer",
          flexGrow: 0,
          justifyContent: "center"
        }}
      />
    </Grow>
  )
})

function AppNotificationPermission() {
  const [showPermissionNotification, setShowPermissionNotification] = React.useState(false)

  React.useEffect(() => {
    hasPermissionToNotify().then(canNotify => setShowPermissionNotification(!canNotify))
  }, [])

  const hidePermissionNotification = React.useCallback(() => setShowPermissionNotification(false), [])

  return <PermissionNotification onHide={hidePermissionNotification} open={showPermissionNotification} />
}

export default React.memo(AppNotificationPermission)
