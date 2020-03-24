import React from "react"
import Snackbar, { SnackbarOrigin } from "@material-ui/core/Snackbar"
import SnackbarContent from "@material-ui/core/SnackbarContent"
import makeStyles from "@material-ui/core/styles/makeStyles"
import CheckIcon from "@material-ui/icons/CheckCircle"
import ErrorIcon from "@material-ui/icons/Error"
import InfoIcon from "@material-ui/icons/Info"
import OfflineBoltIcon from "@material-ui/icons/OfflineBolt"
import blue from "@material-ui/core/colors/blue"
import green from "@material-ui/core/colors/green"
import grey from "@material-ui/core/colors/grey"
import { Notification, NotificationType } from "~App/context/notifications"
import theme from "~App/theme"

const icons: { [key in NotificationType]: React.ComponentType<any> } = {
  connection: OfflineBoltIcon,
  error: ErrorIcon,
  info: InfoIcon,
  success: CheckIcon
}

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

    [theme.breakpoints.down(600)]: {
      width: "90vw"
    }
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
  icon?: React.ComponentType<{ className: string }>
  message: string
  type: NotificationType
  open?: boolean
  onClick?: () => void
  onClose?: () => void
  style?: React.CSSProperties
}

function Notification(props: NotificationProps) {
  const { open = true } = props
  const classes = useNotificationStyles(props)

  const Icon = props.icon || icons[props.type]
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
}

export default React.memo(Notification)
