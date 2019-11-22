import React from "react"
import Snackbar, { SnackbarOrigin } from "@material-ui/core/Snackbar"
import Dialog from "@material-ui/core/Dialog"
import SnackbarContent from "@material-ui/core/SnackbarContent"
import Typography from "@material-ui/core/Typography"
import makeStyles from "@material-ui/core/styles/makeStyles"
import CheckIcon from "@material-ui/icons/CheckCircle"
import ErrorIcon from "@material-ui/icons/Error"
import InfoIcon from "@material-ui/icons/Info"
import OfflineBoltIcon from "@material-ui/icons/OfflineBolt"
import blue from "@material-ui/core/colors/blue"
import green from "@material-ui/core/colors/green"
import grey from "@material-ui/core/colors/grey"
import { Notification, NotificationsContext, NotificationType } from "../context/notifications"
import { useOnlineStatus } from "../hooks/util"
import theme, { FullscreenDialogTransition } from "../theme"
import DialogBody from "./Dialog/DialogBody"
import { DialogActionsBox, ActionButton } from "./Dialog/Generic"
import { Box } from "./Layout/Box"
import MainTitle from "./MainTitle"

const icons: { [key in NotificationType]: React.ComponentType<any> } = {
  connection: OfflineBoltIcon,
  error: ErrorIcon,
  info: InfoIcon,
  success: CheckIcon
}

interface NotificationDetailsProps {
  notification: Notification | null
  onClose: () => void
  showSupportEmail?: boolean
}

const NotificationDetails = React.memo(function NotificationDetails(props: NotificationDetailsProps) {
  const { message = "" } = props.notification || {}
  return (
    <DialogBody
      top={<MainTitle onBack={props.onClose} title="Error" />}
      actions={
        <DialogActionsBox>
          <ActionButton autoFocus onClick={props.onClose} type="primary">
            Dismiss
          </ActionButton>
        </DialogActionsBox>
      }
    >
      <Box alignSelf="center" margin="24px auto 0" width="100%">
        <Typography>{message}</Typography>
      </Box>
      {props.showSupportEmail ? (
        <Box alignSelf="center" margin="36px auto 0" width="100%">
          <Typography align="center" color="textSecondary">
            Having an issue with the app?
            <br />
            Contact us via{" "}
            <a href="mailto:hello@solarwallet.io" style={{ color: "inherit" }} target="_blank">
              hello@solarwallet.io
            </a>
          </Typography>
        </Box>
      ) : null}
    </DialogBody>
  )
})

const useNotificationStyles = makeStyles({
  clickable: {
    cursor: "pointer"
  },
  connection: {
    backgroundColor: grey["500"]
  },
  error: {
    backgroundColor: theme.palette.error.dark
  },
  info: {
    backgroundColor: blue["500"]
  },
  success: {
    backgroundColor: green["500"]
  },
  icon: {
    fontSize: 20,
    opacity: 0.9,
    marginRight: theme.spacing(1)
  },
  message: {
    alignItems: "center",
    display: "flex",
    overflow: "hidden",
    width: "90vw"
  },
  messageText: {
    textOverflow: "ellipsis",
    overflow: "hidden",
    whiteSpace: "nowrap"
  }
})

interface NotificationProps {
  anchorOrigin?: SnackbarOrigin
  autoHideDuration?: number
  contentStyle?: React.CSSProperties
  message: string
  type: NotificationType
  open?: boolean
  onClick?: () => void
  onClose?: () => void
  style?: React.CSSProperties
}

const Notification = React.memo(function Notification(props: NotificationProps) {
  const { open = true } = props
  const classes = useNotificationStyles()

  const Icon = icons[props.type]
  const contentClassnames: { [key in NotificationType]: string } = {
    connection: classes.connection,
    error: classes.error,
    info: classes.info,
    success: classes.success
  }

  return (
    <Snackbar
      anchorOrigin={props.anchorOrigin}
      autoHideDuration={props.autoHideDuration}
      className={props.onClick ? classes.clickable : undefined}
      open={open}
      onClick={props.onClick}
      onClose={props.onClose}
      style={props.style}
    >
      <SnackbarContent
        classes={{
          root: contentClassnames[props.type],
          message: classes.message
        }}
        message={
          <>
            <Icon className={classes.icon} />
            <span className={classes.messageText}>{props.message}</span>
          </>
        }
        style={props.contentStyle}
      />
    </Snackbar>
  )
})

type OfflineNotificationProps = Pick<NotificationProps, "message" | "open">

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
  const [notificationInDialog, setNotificationInDialog] = React.useState<Notification | undefined>()
  const lastShownNotification = React.useRef<Notification | null>(null)

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
    (notification: Notification) => setNotificationInDialog(notification),
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
        autoHideDuration={5000}
        message={visibleNotification ? visibleNotification.message : ""}
        type={visibleNotification ? visibleNotification.type : "error"}
        open={open && (!notificationInDialog || notificationInDialog !== visibleNotification)}
        onClick={onNotificationClick}
        onClose={closeNotification}
      />
      <OfflineNotification message="Offline" open={!isOnline} />
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

export default NotificationsContainer
