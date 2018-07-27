import React from "react"
import { observer } from "mobx-react"
import Snackbar from "@material-ui/core/Snackbar"
import SnackbarContent from "@material-ui/core/SnackbarContent"
import ErrorIcon from "@material-ui/icons/Error"
import { Theme } from "@material-ui/core/styles/createMuiTheme"
import withStyles, { ClassNameMap } from "@material-ui/core/styles/withStyles"
import { ErrorItem } from "../stores/errors"

const styles = (theme: Theme) => ({
  content: {
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

interface ErrorNotificationProps {
  autoHideDuration?: number
  classes: ClassNameMap<keyof ReturnType<typeof styles>>
  error: any
  open?: boolean
  onClose?: () => void
}

const ErrorNotification = (props: ErrorNotificationProps) => {
  const { autoHideDuration, classes, error, open = true, onClose } = props
  return (
    <Snackbar autoHideDuration={autoHideDuration} open={open} onClose={onClose}>
      <SnackbarContent
        className={classes.content}
        message={
          <span className={classes.message}>
            <ErrorIcon className={classes.icon} />
            {error && error.message ? error.message : JSON.stringify(error)}
          </span>
        }
      />
    </Snackbar>
  )
}

const StyledErrorNotification = withStyles(styles)(ErrorNotification)

interface ErrorNotificationContainerProps {
  errors: ErrorItem[]
}

interface ErrorNotificationContainerState {
  lastClosedErrorID: number
}

class ErrorNotificationContainer extends React.Component<
  ErrorNotificationContainerProps,
  ErrorNotificationContainerState
> {
  state = {
    lastClosedErrorID: 0
  }

  closeErrorNotification = (errorItemID: number) => {
    this.setState({
      lastClosedErrorID: errorItemID
    })
  }

  render() {
    const latestErrorItem =
      this.props.errors[this.props.errors.length - 1] || null
    const open =
      latestErrorItem && latestErrorItem.id !== this.state.lastClosedErrorID
    return (
      <StyledErrorNotification
        autoHideDuration={5000}
        error={latestErrorItem ? latestErrorItem.error : null}
        open={open}
        onClose={() => this.closeErrorNotification(latestErrorItem.id)}
      />
    )
  }
}

export default observer(ErrorNotificationContainer)
