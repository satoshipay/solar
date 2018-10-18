import React from "react"
import Snackbar from "@material-ui/core/Snackbar"
import SnackbarContent from "@material-ui/core/SnackbarContent"
import CheckIcon from "@material-ui/icons/CheckCircle"
import ErrorIcon from "@material-ui/icons/Error"
import green from "@material-ui/core/colors/green"
import { Theme } from "@material-ui/core/styles/createMuiTheme"
import withStyles, { ClassNameMap } from "@material-ui/core/styles/withStyles"
import { Notification, NotificationsConsumer, NotificationType } from "../context/notifications"

const icons: { [key in NotificationType]: React.ComponentType<any> } = {
  error: ErrorIcon,
  success: CheckIcon
}

const styles = (theme: Theme) => ({
  error: {
    backgroundColor: theme.palette.error.dark
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
    alignItems: "center"
  }
})

interface NotificationProps {
  autoHideDuration?: number
  classes: ClassNameMap<keyof ReturnType<typeof styles>>
  message: string
  type: NotificationType
  open?: boolean
  onClose?: () => void
}

const Notification = (props: NotificationProps) => {
  const { autoHideDuration, classes, message, type, open = true, onClose } = props

  const Icon = icons[type]
  const contentClassnames: { [key in NotificationType]: string } = {
    error: classes.error,
    success: classes.success
  }

  return (
    <Snackbar autoHideDuration={autoHideDuration} open={open} onClose={onClose}>
      <SnackbarContent
        className={contentClassnames[type]}
        message={
          <span className={classes.message}>
            <Icon className={classes.icon} />
            {message}
          </span>
        }
      />
    </Snackbar>
  )
}

const StyledNotification = withStyles(styles)(Notification)

interface NotificationsProps {
  notifications: Notification[]
}

interface NotificationsState {
  lastClosedNotificationID: number
}

class Notifications extends React.Component<NotificationsProps, NotificationsState> {
  state = {
    lastClosedNotificationID: 0
  }

  lastShownNotification: Notification | null = null

  closeNotification = (notificationID: number) => {
    this.setState({
      lastClosedNotificationID: notificationID
    })
  }

  render() {
    const latestNotificationItem = this.props.notifications[this.props.notifications.length - 1] || null
    const open = latestNotificationItem && latestNotificationItem.id !== this.state.lastClosedNotificationID

    // Fall back to the values of a just-removed notification if necessary
    // Reason: Notification might still be visible / in closing transition when it suddenly gets removed
    const notification = latestNotificationItem || this.lastShownNotification

    if (latestNotificationItem) {
      this.lastShownNotification = latestNotificationItem
    }

    return (
      <StyledNotification
        autoHideDuration={5000}
        message={notification ? notification.message : ""}
        type={notification ? notification.type : "error"}
        open={open}
        onClose={() => this.closeNotification(latestNotificationItem.id)}
      />
    )
  }
}

const NotificationsContainer = (props: {}) => {
  return (
    <NotificationsConsumer>
      {({ notifications }) => <Notifications notifications={notifications} />}
    </NotificationsConsumer>
  )
}

export default NotificationsContainer
