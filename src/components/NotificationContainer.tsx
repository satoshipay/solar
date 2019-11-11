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
    display: "block",
    overflow: "hidden",
    textOverflow: "ellipsis",
    width: "90vw",
    whiteSpace: "nowrap"
  }
})

interface NotificationDetailsDialogProps {
  open: boolean
  notification: Notification | null
  onClose: () => void
}

const NotificationDetailsDialog = React.memo(function NotificationDetailsDialog(props: NotificationDetailsDialogProps) {
  const { open, onClose, notification } = props
  return (
    <Dialog fullScreen open={open} onClose={onClose} TransitionComponent={FullscreenDialogTransition}>
      <DialogBody
        top={<MainTitle onBack={onClose} title={"Error"} />}
        actions={
          <DialogActionsBox>
            <ActionButton autoFocus onClick={onClose} type="primary">
              Dismiss
            </ActionButton>
          </DialogActionsBox>
        }
      >
        <Box alignSelf="center" margin="24px auto 0" maxWidth={400} width="100%">
          <Typography>{notification ? notification.message : ""}</Typography>
        </Box>
      </DialogBody>
    </Dialog>
  )
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

// tslint:disable-next-line no-shadowed-variable
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
})

type OfflineNotificationProps = Pick<NotificationProps, "message" | "open">

// tslint:disable-next-line no-shadowed-variable
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
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const lastShownNotification = React.useRef<Notification | null>(null)

  const latestNotificationItem = notifications[notifications.length - 1] || null
  const open = latestNotificationItem && latestNotificationItem.id !== lastClosedNotificationID

  // Fall back to the values of a just-removed notification if necessary
  // Reason: Notification might still be visible / in closing transition when it suddenly gets removed
  const notification = latestNotificationItem || lastShownNotification.current

  const closeNotification = React.useCallback(() => setLastClosedNotificationID(notification.id), [notification])

  if (latestNotificationItem && latestNotificationItem !== lastShownNotification.current) {
    lastShownNotification.current = latestNotificationItem
  }

  const showNotificationDetails = React.useCallback(() => setDialogOpen(true), [])

  const closeNotificationDetails = React.useCallback(() => {
    closeNotification()
    setDialogOpen(false)
  }, [closeNotification])

  return (
    <>
      <Notification
        autoHideDuration={5000}
        message={notification ? notification.message : ""}
        type={notification ? notification.type : "error"}
        open={open && !dialogOpen}
        onClick={notification && notification.onClick ? notification.onClick : showNotificationDetails}
        onClose={closeNotification}
      />
      <OfflineNotification message="Offline" open={!isOnline} />
      <NotificationDetailsDialog
        open={dialogOpen}
        onClose={closeNotificationDetails}
        notification={latestNotificationItem}
      />
    </>
  )
}

export default NotificationsContainer
