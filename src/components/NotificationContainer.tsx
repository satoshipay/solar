import React from "react"
import { observer } from "mobx-react"
import Snackbar from "@material-ui/core/Snackbar"
import SnackbarContent from "@material-ui/core/SnackbarContent"
import ErrorIcon from "@material-ui/icons/Error"
import { Theme } from "@material-ui/core/styles/createMuiTheme"
import withStyles, { ClassNameMap } from "@material-ui/core/styles/withStyles"
import { Notification as NotificationObject, NotificationType } from "../stores/notifications"

const styles = (theme: Theme) => ({
  error: {
    backgroundColor: theme.palette.error.dark
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
  const contentClassname = classes.error

  return (
    <Snackbar autoHideDuration={autoHideDuration} open={open} onClose={onClose}>
      <SnackbarContent
        className={contentClassname}
        message={
          <span className={classes.message}>
            <ErrorIcon className={classes.icon} />
            {message}
          </span>
        }
      />
    </Snackbar>
  )
}

const StyledNotification = withStyles(styles)(Notification)

interface NotificationContainerProps {
  notifications: NotificationObject[]
}

interface NotificationContainerState {
  lastClosedNotificationID: number
}

class NotificationContainer extends React.Component<NotificationContainerProps, NotificationContainerState> {
  state = {
    lastClosedNotificationID: 0
  }

  closeNotification = (notificationID: number) => {
    this.setState({
      lastClosedNotificationID: notificationID
    })
  }

  render() {
    const latestNotificationItem = this.props.notifications[this.props.notifications.length - 1] || null
    const open = latestNotificationItem && latestNotificationItem.id !== this.state.lastClosedNotificationID
    return (
      <StyledNotification
        autoHideDuration={5000}
        message={latestNotificationItem ? latestNotificationItem.message : ""}
        type={latestNotificationItem ? latestNotificationItem.type : "error"}
        open={open}
        onClose={() => this.closeNotification(latestNotificationItem.id)}
      />
    )
  }
}

export default observer(NotificationContainer)
