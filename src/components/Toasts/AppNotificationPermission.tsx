import React from "react"
import Grow from "@material-ui/core/Grow"
import SnackbarContent from "@material-ui/core/SnackbarContent"
import { useTheme } from "@material-ui/core/styles"
import NotificationsIcon from "@material-ui/icons/Notifications"
import { NotificationsContext, trackError } from "../../context/notifications"
import {
  hasPermission as hasPermissionToNotify,
  requestPermission as requestPermissionToNotify,
  showNotification
} from "../../platform/notifications"
import { HorizontalLayout } from "../Layout/Box"

interface PermissionNotificationProps {
  onHide: () => void
  open: boolean
}

const PermissionNotification = React.memo(function PermissionNotification(props: PermissionNotificationProps) {
  const { onHide } = props
  const Notifications = React.useContext(NotificationsContext)
  const theme = useTheme()

  const requestPermission = React.useCallback(() => {
    ;(async () => {
      const granted = await requestPermissionToNotify()
      onHide()

      if (granted) {
        showNotification({
          title: "Notifications enabled",
          text: "Solar will now show notifications"
        })
      } else {
        Notifications.showNotification("error", "Enable in operating system settings.")
      }
    })().catch(trackError)
  }, [Notifications, onHide])

  return (
    <Grow in={props.open}>
      <SnackbarContent
        message={
          <HorizontalLayout alignItems="center">
            <NotificationsIcon />
            <span style={{ ...theme.typography.button, marginLeft: 8 }}>Enable app notifications</span>
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
