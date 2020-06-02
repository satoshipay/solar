import React from "react"
import { useTranslation } from "react-i18next"
import IconButton from "@material-ui/core/IconButton"
import Grow from "@material-ui/core/Grow"
import SnackbarContent from "@material-ui/core/SnackbarContent"
import Tooltip from "@material-ui/core/Tooltip"
import { useTheme } from "@material-ui/core/styles"
import CloseIcon from "@material-ui/icons/Close"
import CheckIcon from "@material-ui/icons/Check"
import { NotificationsContext } from "~App/contexts/notifications"
import { HorizontalLayout } from "~Layout/components/Box"
import {
  isDefaultProtocolClient,
  isDifferentHandlerInstalled,
  setAsDefaultProtocolClient
} from "~platform/protocol-handler"

function isNotificationDismissed() {
  return localStorage.getItem("protocol-handler-notification-dismissed") !== null
}

function setNotificationDismissed() {
  localStorage.setItem("protocol-handler-notification-dismissed", "true")
}

interface PermissionNotificationProps {
  onHide: () => void
  open: boolean
}

const PermissionNotification = React.memo(function PermissionNotification(props: PermissionNotificationProps) {
  const { onHide } = props
  const { showNotification } = React.useContext(NotificationsContext)
  const theme = useTheme()
  const { t } = useTranslation()

  const requestPermission = React.useCallback(() => {
    setAsDefaultProtocolClient().then(success => {
      if (success) {
        showNotification("success", t("app.notification.permission.protocol-handler.success"))
      } else {
        showNotification("error", t("app.notification.permission.protocol-handler.error"))
      }
      onHide()
    })
  }, [onHide, showNotification, t])

  const dismiss = React.useCallback(() => {
    setNotificationDismissed()
    onHide()
  }, [onHide])

  return (
    <Grow in={props.open}>
      <SnackbarContent
        message={
          <HorizontalLayout alignItems="center">
            <span style={{ ...theme.typography.button, marginLeft: 8 }}>
              {t("app.notification.permission.protocol-handler.message")}
            </span>
            <Tooltip title={t("app.notification.permission.protocol-handler.tooltip.install")}>
              <IconButton onClick={requestPermission} style={{ color: "inherit" }}>
                <CheckIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title={t("app.notification.permission.protocol-handler.tooltip.dismiss")}>
              <IconButton onClick={dismiss} style={{ color: "inherit" }}>
                <CloseIcon />
              </IconButton>
            </Tooltip>
          </HorizontalLayout>
        }
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

function ProtocolHandlerPermission() {
  const [showPermissionNotification, setShowPermissionNotification] = React.useState(false)

  React.useEffect(() => {
    if (isNotificationDismissed()) {
      return
    }

    isDefaultProtocolClient().then(isDefault => {
      if (isDefault) {
        setShowPermissionNotification(false)
      } else {
        isDifferentHandlerInstalled().then(isDifferentInstalled => {
          if (!isDifferentInstalled) {
            setAsDefaultProtocolClient()
            setShowPermissionNotification(false)
          } else {
            setShowPermissionNotification(true)
          }
        })
      }
    })
  }, [])

  const hidePermissionNotification = React.useCallback(() => setShowPermissionNotification(false), [])

  return <PermissionNotification onHide={hidePermissionNotification} open={showPermissionNotification} />
}

export default React.memo(ProtocolHandlerPermission)
