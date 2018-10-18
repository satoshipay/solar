import React from "react"
import Button from "@material-ui/core/Button"
import Dialog from "@material-ui/core/Dialog"
import DialogActions from "@material-ui/core/DialogActions"
import DialogContent from "@material-ui/core/DialogContent"
import DialogTitle from "@material-ui/core/DialogTitle"
import FormControlLabel from "@material-ui/core/FormControlLabel"
import InputAdornment from "@material-ui/core/InputAdornment"
import Switch from "@material-ui/core/Switch"
import TextField from "@material-ui/core/TextField"
import LockIcon from "@material-ui/icons/LockOutlined"
import LockOpenIcon from "@material-ui/icons/LockOpenOutlined"
import { Box, HorizontalLayout } from "../Layout/Box"
import { Account, AccountsContext } from "../../context/accounts"
import { NotificationsConsumer, NotificationContext } from "../../context/notifications"
import { renderFormFieldError } from "../../lib/errors"
import ButtonIconLabel from "../ButtonIconLabel"
import CloseButton from "./CloseButton"

const adornmentLock = (
  <InputAdornment position="start">
    <LockIcon color="disabled" />
  </InputAdornment>
)

const adornmentLockOpen = (
  <InputAdornment position="start">
    <LockOpenIcon color="disabled" />
  </InputAdornment>
)

interface FormValues {
  nextPassword: string
  nextPasswordRepeat: string
  prevPassword: string
}

type Errors = { [key in keyof FormValues]?: Error | undefined }

function validateFormValues(formValues: FormValues, passwordMode: "change" | "initial" | "remove") {
  const errors: Errors = {}

  if (!formValues.prevPassword && passwordMode !== "initial") {
    errors.prevPassword = new Error("Current password is missing.")
  }
  if (passwordMode !== "remove") {
    if (!formValues.nextPassword) {
      errors.nextPassword = new Error(`Enter a password or set "remove password".`)
    }
    if (!formValues.nextPasswordRepeat) {
      errors.nextPasswordRepeat = new Error("Please repeat the password.")
    }
    if (formValues.nextPasswordRepeat && formValues.nextPassword !== formValues.nextPasswordRepeat) {
      errors.nextPasswordRepeat = new Error("Password does not match.")
    }
  }

  const success = Object.keys(errors).length === 0
  return { errors, success }
}

interface ActionsProps {
  isPasswordProtected: boolean
  removePassword: boolean
  onSubmit: () => void
  onToggleRemovePassword: () => void
}

const Actions = (props: ActionsProps) => {
  return (
    <HorizontalLayout justifyContent="space-between">
      {props.isPasswordProtected ? (
        <FormControlLabel
          control={<Switch checked={props.removePassword} onChange={props.onToggleRemovePassword} />}
          label="Remove password"
        />
      ) : (
        <div />
      )}
      <Button variant="contained" color="primary" onClick={props.onSubmit} type="submit">
        <ButtonIconLabel label={props.removePassword ? "Remove password" : "Change password"}>
          <LockIcon />
        </ButtonIconLabel>
      </Button>
    </HorizontalLayout>
  )
}

interface Props {
  account: Account
  open: boolean
  addError: NotificationContext["addError"]
  addNotification: NotificationContext["addNotification"]
  changePassword: AccountsContext["changePassword"]
  removePassword: AccountsContext["removePassword"]
  onClose: () => void
}

interface State {
  errors: Errors
  formValues: FormValues
  removePassword: boolean
}

class ChangePasswordDialog extends React.Component<Props, State> {
  state: State = {
    errors: {},
    formValues: {
      nextPassword: "",
      nextPasswordRepeat: "",
      prevPassword: ""
    },
    removePassword: false
  }

  changePassword = () => {
    const { addError, addNotification, changePassword } = this.props
    const { id: accountID, requiresPassword } = this.props.account
    const { nextPassword, prevPassword } = this.state.formValues

    const passwordMode = requiresPassword ? "change" : "initial"

    const { errors, success } = validateFormValues(this.state.formValues, passwordMode)
    this.setState({ errors })

    if (success) {
      // TODO: Show confirmation prompt (dialog)
      changePassword(accountID, prevPassword, nextPassword)
        .then(() => {
          addNotification("success", requiresPassword ? "Password changed." : "Password set.")
          this.props.onClose()
        })
        .catch(addError)
    }
  }

  removePassword = () => {
    const { addError, addNotification, removePassword } = this.props
    const { errors, success } = validateFormValues(this.state.formValues, "remove")
    this.setState({ errors })

    if (success) {
      // TODO: Show confirmation prompt (dialog)
      removePassword(this.props.account.id, this.state.formValues.prevPassword)
        .then(() => {
          addNotification("success", "Password removed.")
          this.props.onClose()
        })
        .catch(addError)
    }
  }

  setFormValue = (name: keyof FormValues, value: string) => {
    this.setState({
      formValues: {
        ...this.state.formValues,
        [name]: value
      }
    })
  }

  toggleRemovePassword = () => {
    this.setState({ removePassword: !this.state.removePassword })
  }

  render() {
    const { account, open, onClose } = this.props
    const { errors, formValues, removePassword } = this.state

    return (
      <Dialog
        open={open}
        onClose={onClose}
        PaperProps={{ style: { minWidth: 500, transition: "width 2s, min-width 2s" } }}
      >
        <CloseButton onClick={onClose} />
        <DialogTitle>{account.requiresPassword ? "Change Password" : "Set Password"}</DialogTitle>
        <DialogContent>
          <Box hidden={!account.requiresPassword} margin="0 0 16px">
            <TextField
              error={Boolean(errors.prevPassword)}
              label={errors.prevPassword ? renderFormFieldError(errors.prevPassword) : "Current password"}
              fullWidth
              margin="dense"
              value={formValues.prevPassword}
              onChange={event => this.setFormValue("prevPassword", event.target.value)}
              type="password"
              InputProps={{ startAdornment: adornmentLockOpen }}
            />
          </Box>
          <Box hidden={removePassword}>
            <TextField
              error={Boolean(errors.nextPassword)}
              label={errors.nextPassword ? renderFormFieldError(errors.nextPassword) : "New password"}
              fullWidth
              margin="dense"
              value={formValues.nextPassword}
              onChange={event => this.setFormValue("nextPassword", event.target.value)}
              type="password"
              InputProps={{ startAdornment: adornmentLock }}
            />
            <TextField
              error={Boolean(errors.nextPasswordRepeat)}
              label={
                errors.nextPasswordRepeat ? renderFormFieldError(errors.nextPasswordRepeat) : "Repeat new password"
              }
              fullWidth
              margin="dense"
              value={formValues.nextPasswordRepeat}
              onChange={event => this.setFormValue("nextPasswordRepeat", event.target.value)}
              type="password"
              InputProps={{ startAdornment: adornmentLock }}
            />
          </Box>
        </DialogContent>
        <DialogActions style={{ padding: "0 24px 24px", margin: "8px 0 0" }}>
          <Actions
            isPasswordProtected={account.requiresPassword}
            onSubmit={removePassword ? this.removePassword : this.changePassword}
            onToggleRemovePassword={this.toggleRemovePassword}
            removePassword={removePassword}
          />
        </DialogActions>
      </Dialog>
    )
  }
}

const ChangePasswordContainer = (props: Props) => {
  return (
    <NotificationsConsumer>
      {({ addError, addNotification }) => (
        <ChangePasswordDialog {...props} addError={addError} addNotification={addNotification} />
      )}
    </NotificationsConsumer>
  )
}

export default ChangePasswordContainer
