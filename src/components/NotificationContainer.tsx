import React from "react"
import Snackbar, { SnackbarOrigin } from "@material-ui/core/Snackbar"
import SnackbarContent from "@material-ui/core/SnackbarContent"
import CheckIcon from "@material-ui/icons/CheckCircle"
import ErrorIcon from "@material-ui/icons/Error"
import InfoIcon from "@material-ui/icons/Info"
import OfflineBoltIcon from "@material-ui/icons/OfflineBolt"
import blue from "@material-ui/core/colors/blue"
import green from "@material-ui/core/colors/green"
import grey from "@material-ui/core/colors/grey"
import withStyles, { ClassNameMap, StyleRules } from "@material-ui/core/styles/withStyles"
import { Notification, NotificationsContext, NotificationType } from "../context/notifications"
import { useOnlineStatus } from "../hooks"
import theme from "../theme"

const icons: { [key in NotificationType]: React.ComponentType<any> } = {
  connection: OfflineBoltIcon,
  error: ErrorIcon,
  info: InfoIcon,
  success: CheckIcon
}

const styles: StyleRules = {
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
    display: "flex",
    alignItems: "center",
    whiteSpace: "pre"
  }
}

interface NotificationProps {
  anchorOrigin?: SnackbarOrigin
  autoHideDuration?: number
  classes: ClassNameMap<keyof typeof styles>
  contentStyle?: React.CSSProperties
  message: string
  type: NotificationType
  open?: boolean
  onClick?: () => void
  onClose?: () => void
  style?: React.CSSProperties
}

function NotificationSnackbar(props: NotificationProps) {
  const { classes, open = true } = props

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
        className={contentClassnames[props.type]}
        message={
          <span className={classes.message}>
            <Icon className={classes.icon} />
            {props.message}
          </span>
        }
        style={props.contentStyle}
      />
    </Snackbar>
  )
}

const StyledNotification = withStyles(styles)(NotificationSnackbar)

function NotificationsContainer() {
  const { notifications } = React.useContext(NotificationsContext)
  const { isOnline } = useOnlineStatus()
  const [lastClosedNotificationID, setLastClosedNotificationID] = React.useState(0)
  const lastShownNotification = React.useRef<Notification | null>(null)

  const latestNotificationItem = notifications[notifications.length - 1] || null
  const open = latestNotificationItem && latestNotificationItem.id !== lastClosedNotificationID

  const closeNotification = (someNotification: Notification) => setLastClosedNotificationID(someNotification.id)

  // Fall back to the values of a just-removed notification if necessary
  // Reason: Notification might still be visible / in closing transition when it suddenly gets removed
  const notification = latestNotificationItem || lastShownNotification.current

  if (latestNotificationItem && latestNotificationItem !== lastShownNotification.current) {
    lastShownNotification.current = latestNotificationItem
  }

  return (
    <>
      <StyledNotification
        autoHideDuration={5000}
        message={notification ? notification.message : ""}
        type={notification ? notification.type : "error"}
        open={open}
        onClick={notification ? notification.onClick : undefined}
        onClose={() => closeNotification(notification)}
      />
      <StyledNotification
        anchorOrigin={{
          horizontal: "left",
          vertical: "bottom"
        }}
        contentStyle={{ minWidth: 0 }}
        message="Offline"
        open={!isOnline}
        style={{ bottom: 0 }}
        type="connection"
      />
    </>
  )
}

export default NotificationsContainer
