import React from "react"
import { useContext, useRef, useState } from "react"
import Snackbar from "@material-ui/core/Snackbar"
import SnackbarContent from "@material-ui/core/SnackbarContent"
import CheckIcon from "@material-ui/icons/CheckCircle"
import ErrorIcon from "@material-ui/icons/Error"
import InfoIcon from "@material-ui/icons/Info"
import blue from "@material-ui/core/colors/blue"
import green from "@material-ui/core/colors/green"
import withStyles, { ClassNameMap, StyleRulesCallback } from "@material-ui/core/styles/withStyles"
import { Notification, NotificationsContext, NotificationType } from "../context/notifications"

const icons: { [key in NotificationType]: React.ComponentType<any> } = {
  error: ErrorIcon,
  info: InfoIcon,
  success: CheckIcon
}

const styles: StyleRulesCallback = theme => ({
  clickable: {
    cursor: "pointer"
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
    marginRight: theme.spacing.unit
  },
  message: {
    display: "flex",
    alignItems: "center",
    whiteSpace: "pre"
  }
})

interface NotificationProps {
  autoHideDuration?: number
  classes: ClassNameMap<keyof ReturnType<typeof styles>>
  message: string
  type: NotificationType
  open?: boolean
  onClick?: () => void
  onClose?: () => void
}

function NotificationSnackbar(props: NotificationProps) {
  const { classes, open = true } = props

  const Icon = icons[props.type]
  const contentClassnames: { [key in NotificationType]: string } = {
    error: classes.error,
    info: classes.info,
    success: classes.success
  }

  return (
    <Snackbar
      autoHideDuration={props.autoHideDuration}
      className={props.onClick ? classes.clickable : undefined}
      open={open}
      onClick={props.onClick}
      onClose={props.onClose}
    >
      <SnackbarContent
        className={contentClassnames[props.type]}
        message={
          <span className={classes.message}>
            <Icon className={classes.icon} />
            {props.message}
          </span>
        }
      />
    </Snackbar>
  )
}

const StyledNotification = withStyles(styles)(NotificationSnackbar)

function NotificationsContainer() {
  const { notifications } = useContext(NotificationsContext)
  const [lastClosedNotificationID, setLastClosedNotificationID] = useState(0)
  const lastShownNotification = useRef<Notification | null>(null)

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
    <StyledNotification
      autoHideDuration={5000}
      message={notification ? notification.message : ""}
      type={notification ? notification.type : "error"}
      open={open}
      onClick={notification ? notification.onClick : undefined}
      onClose={() => closeNotification(notification)}
    />
  )
}

export default NotificationsContainer
