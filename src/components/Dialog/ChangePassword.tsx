import React from "react"
import DialogActions from "@material-ui/core/DialogActions"
import DialogContent from "@material-ui/core/DialogContent"
import DialogTitle from "@material-ui/core/DialogTitle"
import FormControlLabel from "@material-ui/core/FormControlLabel"
import InputAdornment from "@material-ui/core/InputAdornment"
import Switch from "@material-ui/core/Switch"
import TextField from "@material-ui/core/TextField"
import LockIcon from "@material-ui/icons/LockOutlined"
import LockOpenIcon from "@material-ui/icons/LockOpenOutlined"
import { Box, VerticalLayout } from "../Layout/Box"
import { Account, AccountsContext } from "../../context/accounts"
import { NotificationsContext } from "../../context/notifications"
import { useIsMobile } from "../../hooks"
import { renderFormFieldError, isWrongPasswordError } from "../../lib/errors"
import CloseButton from "./CloseButton"
import { ActionButton, DialogActionsBox } from "./Generic"

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

function Actions(props: ActionsProps) {
  const isSmallScreen = useIsMobile()
  return (
    <DialogActionsBox smallDialog>
      {props.isPasswordProtected ? (
        isSmallScreen ? (
          <ActionButton onClick={props.onToggleRemovePassword} type="secondary">
            {props.removePassword ? "Change password" : "Remove password"}
          </ActionButton>
        ) : (
          <FormControlLabel
            control={<Switch checked={props.removePassword} onChange={props.onToggleRemovePassword} />}
            label="Remove password"
          />
        )
      ) : null}
      <ActionButton icon={<LockIcon />} onClick={props.onSubmit} type="primary">
        {isSmallScreen
          ? props.removePassword
            ? "Remove"
            : "Change"
          : props.removePassword
            ? "Remove password"
            : "Change password"}
      </ActionButton>
    </DialogActionsBox>
  )
}

interface Props {
  account: Account
  onClose: () => void
}

function ChangePasswordDialog(props: Props) {
  const Accounts = React.useContext(AccountsContext)
  const { showError, showNotification } = React.useContext(NotificationsContext)
  const [errors, setErrors] = React.useState<Errors>({})
  const [formValues, setFormValues] = React.useState<FormValues>({
    nextPassword: "",
    nextPasswordRepeat: "",
    prevPassword: ""
  })
  const [removingPassword, setRemovingPassword] = React.useState(false)

  const changePassword = () => {
    const { id: accountID, requiresPassword } = props.account
    const { nextPassword, prevPassword } = formValues

    const passwordMode = requiresPassword ? "change" : "initial"

    const validation = validateFormValues(formValues, passwordMode)
    setErrors(validation.errors)

    if (validation.success) {
      // TODO: Show confirmation prompt (dialog)
      Accounts.changePassword(accountID, prevPassword, nextPassword)
        .then(() => {
          showNotification("success", requiresPassword ? "Password changed." : "Password set.")
          props.onClose()
        })
        .catch(error => {
          isWrongPasswordError(error) ? setErrors({ prevPassword: error }) : showError(error)
        })
    }
  }
  const onClose = () => {
    props.onClose()
    setFormValues({
      nextPassword: "",
      nextPasswordRepeat: "",
      prevPassword: ""
    })
  }
  const removePassword = () => {
    const validation = validateFormValues(formValues, "remove")
    setErrors(validation.errors)

    if (validation.success) {
      // TODO: Show confirmation prompt (dialog)
      Accounts.removePassword(props.account.id, formValues.prevPassword)
        .then(() => {
          showNotification("success", "Password removed.")
          props.onClose()
        })
        .catch(error => {
          isWrongPasswordError(error) ? setErrors({ prevPassword: error }) : showError(error)
        })
    }
  }
  const setFormValue = (name: keyof FormValues, value: string) => {
    setFormValues({
      ...formValues,
      [name]: value
    })
  }
  const toggleRemovePassword = () => setRemovingPassword(!removingPassword)

  return (
    <VerticalLayout minWidth={250}>
      <CloseButton onClick={onClose} />
      <DialogTitle>{props.account.requiresPassword ? "Change Password" : "Set Password"}</DialogTitle>
      <DialogContent>
        <Box hidden={!props.account.requiresPassword} margin="0 0 16px">
          <TextField
            autoFocus={props.account.requiresPassword && process.env.PLATFORM !== "ios"}
            error={Boolean(errors.prevPassword)}
            label={errors.prevPassword ? renderFormFieldError(errors.prevPassword) : "Current password"}
            fullWidth
            margin="dense"
            value={formValues.prevPassword}
            onChange={event => setFormValue("prevPassword", event.target.value)}
            type="password"
            InputProps={{ startAdornment: adornmentLockOpen }}
          />
        </Box>
        <Box hidden={removingPassword}>
          <TextField
            error={Boolean(errors.nextPassword)}
            label={errors.nextPassword ? renderFormFieldError(errors.nextPassword) : "New password"}
            fullWidth
            margin="dense"
            value={formValues.nextPassword}
            onChange={event => setFormValue("nextPassword", event.target.value)}
            type="password"
            InputProps={{ startAdornment: adornmentLock }}
          />
          <TextField
            error={Boolean(errors.nextPasswordRepeat)}
            label={errors.nextPasswordRepeat ? renderFormFieldError(errors.nextPasswordRepeat) : "Repeat new password"}
            fullWidth
            margin="dense"
            value={formValues.nextPasswordRepeat}
            onChange={event => setFormValue("nextPasswordRepeat", event.target.value)}
            type="password"
            InputProps={{ startAdornment: adornmentLock }}
          />
        </Box>
        <DialogActions style={{ margin: "32px 0 0" }}>
          <Actions
            isPasswordProtected={props.account.requiresPassword}
            onSubmit={removingPassword ? removePassword : changePassword}
            onToggleRemovePassword={toggleRemovePassword}
            removePassword={removingPassword}
          />
        </DialogActions>
      </DialogContent>
    </VerticalLayout>
  )
}

export default React.memo(ChangePasswordDialog)
