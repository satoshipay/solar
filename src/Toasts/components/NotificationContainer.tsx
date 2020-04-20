import React from "react"
import { useTranslation, Trans } from "react-i18next"
import Dialog from "@material-ui/core/Dialog"
import Typography from "@material-ui/core/Typography"
import { Notification as NotificationType, NotificationsContext } from "~App/contexts/notifications"
import { useOnlineStatus } from "~Generic/hooks/util"
import { FullscreenDialogTransition } from "~App/theme"
import DialogBody from "~Layout/components/DialogBody"
import { DialogActionsBox, ActionButton } from "~Generic/components/DialogActions"
import { Box } from "~Layout/components/Box"
import MainTitle from "~Generic/components/MainTitle"
import Notification from "./Notification"

export const autoHideDuration = 5000

interface NotificationDetailsProps {
  notification: NotificationType | null
  onClose: () => void
  showSupportEmail?: boolean
}

const NotificationDetails = React.memo(function NotificationDetails(props: NotificationDetailsProps) {
  const { message = "" } = props.notification || {}
  const { t } = useTranslation()
  return (
    <DialogBody
      top={<MainTitle onBack={props.onClose} title={t("app.notification.details.title")} />}
      actions={
        <DialogActionsBox>
          <ActionButton autoFocus onClick={props.onClose} type="primary">
            {t("app.notification.details.action.dismiss")}
          </ActionButton>
        </DialogActionsBox>
      }
    >
      <Box alignSelf="center" margin="24px auto 0" width="100%">
        <Typography style={{ whiteSpace: "pre-wrap" }}>{message}</Typography>
      </Box>
      {props.showSupportEmail ? (
        <Box alignSelf="center" margin="36px auto 0" width="100%">
          <Typography align="center" color="textSecondary">
            <Trans i18nKey="app.notification.details.support">
              Having an issue with the app?
              <br />
              Contact us via
            </Trans>{" "}
            <a
              href="mailto:hello@solarwallet.io"
              style={{ color: "inherit" }}
              target="_blank"
              rel="noopener noreferrer"
            >
              hello@solarwallet.io
            </a>
          </Typography>
        </Box>
      ) : null}
    </DialogBody>
  )
})

interface OfflineNotificationProps {
  message: string
  open: boolean
}

const OfflineNotification = React.memo(function OfflineNotification(props: OfflineNotificationProps) {
  const anchorOrigin = React.useMemo(
    () =>
      ({
        horizontal: "left",
        vertical: "bottom"
      } as const),
    []
  )
  const contentStyle = React.useMemo(
    () =>
      ({
        minWidth: 0
      } as const),
    []
  )

  return <Notification anchorOrigin={anchorOrigin} contentStyle={contentStyle} type="connection" {...props} />
})

function NotificationsContainer() {
  const { notifications } = React.useContext(NotificationsContext)
  const { isOnline } = useOnlineStatus()
  const [lastClosedNotificationID, setLastClosedNotificationID] = React.useState(0)
  const [notificationInDialog, setNotificationInDialog] = React.useState<NotificationType | undefined>()
  const lastShownNotification = React.useRef<NotificationType | null>(null)
  const { t } = useTranslation()

  const latestNotificationItem = notifications[notifications.length - 1] || null
  const open = latestNotificationItem && latestNotificationItem.id !== lastClosedNotificationID

  // Fall back to the values of a just-removed notification if necessary
  // Reason: Notification might still be visible / in closing transition when it suddenly gets removed
  const visibleNotification = latestNotificationItem || lastShownNotification.current

  const closeNotification = React.useCallback(() => setLastClosedNotificationID(visibleNotification.id), [
    visibleNotification
  ])

  if (latestNotificationItem && latestNotificationItem !== lastShownNotification.current) {
    lastShownNotification.current = latestNotificationItem
  }

  const showNotificationDetails = React.useCallback(
    (notification: NotificationType) => setNotificationInDialog(notification),
    []
  )

  const closeNotificationDetails = React.useCallback(() => {
    closeNotification()
    setNotificationInDialog(undefined)
  }, [closeNotification])

  const onNotificationClick = React.useCallback(() => {
    if (visibleNotification && visibleNotification.onClick) {
      visibleNotification.onClick()
    } else if (visibleNotification && visibleNotification.type === "error") {
      showNotificationDetails(visibleNotification)
    }
  }, [visibleNotification, showNotificationDetails])

  return (
    <>
      <Notification
        autoHideDuration={autoHideDuration}
        message={visibleNotification ? visibleNotification.message : ""}
        type={visibleNotification ? visibleNotification.type : "error"}
        open={open && (!notificationInDialog || notificationInDialog !== visibleNotification)}
        onClick={onNotificationClick}
        onClose={closeNotification}
      />
      <OfflineNotification message={t("app.notification.details.offline")} open={!isOnline} />
      <Dialog
        fullScreen
        open={Boolean(notificationInDialog)}
        onClose={closeNotificationDetails}
        TransitionComponent={FullscreenDialogTransition}
      >
        <NotificationDetails
          notification={latestNotificationItem}
          onClose={closeNotificationDetails}
          showSupportEmail
        />
      </Dialog>
    </>
  )
}

export default React.memo(NotificationsContainer)
