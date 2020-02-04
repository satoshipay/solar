import React from "react"
import { useTranslation } from "react-i18next"
import DialogActions from "@material-ui/core/DialogActions"
import FormControlLabel from "@material-ui/core/FormControlLabel"
import InputAdornment from "@material-ui/core/InputAdornment"
import Switch from "@material-ui/core/Switch"
import TextField from "@material-ui/core/TextField"
import LockIcon from "@material-ui/icons/LockOutlined"
import LockOpenIcon from "@material-ui/icons/LockOpenOutlined"
import { Account, AccountsContext } from "../../context/accounts"
import { NotificationsContext } from "../../context/notifications"
import { useIsMobile } from "../../hooks/userinterface"
import { renderFormFieldError, isWrongPasswordError } from "../../lib/errors"
import { ActionButton, DialogActionsBox } from "../Dialog/Generic"
import { Box } from "../Layout/Box"
import DialogBody from "../Dialog/DialogBody"
import MainTitle from "../MainTitle"

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

function useFormValidation() {
  const { t } = useTranslation()
  return function validate(formValues: FormValues, passwordMode: "change" | "initial" | "remove") {
    const errors: Errors = {}

    if (!formValues.prevPassword && passwordMode !== "initial") {
      errors.prevPassword = new Error(t("set-password.validation.previous-password-missing"))
    }
    if (passwordMode !== "remove") {
      if (!formValues.nextPassword) {
        errors.nextPassword = new Error(t("set-password.validation.next-password-missing"))
      }
      if (!formValues.nextPasswordRepeat) {
        errors.nextPasswordRepeat = new Error(t("set-password.validation.next-password-repeat-missing"))
      }
      if (formValues.nextPasswordRepeat && formValues.nextPassword !== formValues.nextPasswordRepeat) {
        errors.nextPasswordRepeat = new Error(t("set-password.validation.passwords-no-match"))
      }
    }

    const success = Object.keys(errors).length === 0
    return { errors, success }
  }
}

interface ActionsProps {
  isPasswordProtected: boolean
  removePassword: boolean
  onSubmit: () => void
  onToggleRemovePassword: () => void
}

function Actions(props: ActionsProps) {
  const isSmallScreen = useIsMobile()
  const { t } = useTranslation()

  return (
    <DialogActionsBox smallDialog>
      {props.isPasswordProtected ? (
        isSmallScreen ? (
          <ActionButton onClick={props.onToggleRemovePassword} type="secondary">
            {props.removePassword
              ? t("set-password.action.change-password.long")
              : t("set-password.action.remove-password.long")}
          </ActionButton>
        ) : (
          <FormControlLabel
            control={<Switch checked={props.removePassword} color="primary" onChange={props.onToggleRemovePassword} />}
            label={t("set-password.action.remove-password.long")}
          />
        )
      ) : null}
      <ActionButton icon={<LockIcon />} onClick={props.onSubmit} type="primary">
        {isSmallScreen
          ? props.removePassword
            ? t("set-password.action.remove-password.long")
            : t("set-password.action.change-password.short")
          : props.removePassword
          ? t("set-password.action.remove-password.long")
          : t("set-password.action.change-password.long")}
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
  const validate = useFormValidation()
  const { t } = useTranslation()

  const changePassword = () => {
    const { id: accountID, requiresPassword } = props.account
    const { nextPassword, prevPassword } = formValues

    const passwordMode = requiresPassword ? "change" : "initial"

    const validation = validate(formValues, passwordMode)
    setErrors(validation.errors)

    if (validation.success) {
      // TODO: Show confirmation prompt (dialog)
      Accounts.changePassword(accountID, prevPassword, nextPassword)
        .then(() => {
          showNotification(
            "success",
            requiresPassword
              ? t("set-password.notification.password-changed")
              : t("set-password.notification.password-set")
          )
          props.onClose()
        })
        .catch(error => {
          isWrongPasswordError(error)
            ? setErrors({ prevPassword: new Error(t("common.wrong-password")) })
            : showError(error)
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
    const validation = validate(formValues, "remove")
    setErrors(validation.errors)

    if (validation.success) {
      // TODO: Show confirmation prompt (dialog)
      Accounts.removePassword(props.account.id, formValues.prevPassword)
        .then(() => {
          showNotification("success", t("set-password.notification.password-removed"))
          props.onClose()
        })
        .catch(error => {
          isWrongPasswordError(error)
            ? setErrors({ prevPassword: new Error(t("common.wrong-password")) })
            : showError(error)
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
    <DialogBody
      top={
        <MainTitle
          onBack={onClose}
          title={
            props.account.requiresPassword
              ? t("set-password.title.change-password")
              : t("set-password.title.set-password")
          }
        />
      }
      actions={
        <DialogActions style={{ margin: "32px 0 0" }}>
          <Actions
            isPasswordProtected={props.account.requiresPassword}
            onSubmit={removingPassword ? removePassword : changePassword}
            onToggleRemovePassword={toggleRemovePassword}
            removePassword={removingPassword}
          />
        </DialogActions>
      }
    >
      <Box alignSelf="center" margin="24px auto 0" maxWidth={400} width="100%">
        <Box hidden={!props.account.requiresPassword} margin="0 0 8px">
          <TextField
            autoFocus={props.account.requiresPassword && process.env.PLATFORM !== "ios"}
            error={Boolean(errors.prevPassword)}
            label={
              errors.prevPassword
                ? renderFormFieldError(errors.prevPassword)
                : t("set-password.textfield.prev-password.label")
            }
            fullWidth
            margin="normal"
            value={formValues.prevPassword}
            onChange={event => setFormValue("prevPassword", event.target.value)}
            type="password"
            InputProps={{ startAdornment: adornmentLockOpen }}
          />
        </Box>
        <Box hidden={removingPassword}>
          <TextField
            autoFocus={!props.account.requiresPassword && process.env.PLATFORM !== "ios"}
            error={Boolean(errors.nextPassword)}
            label={
              errors.nextPassword
                ? renderFormFieldError(errors.nextPassword)
                : t("set-password.textfield.next-password.label")
            }
            fullWidth
            margin="normal"
            value={formValues.nextPassword}
            onChange={event => setFormValue("nextPassword", event.target.value)}
            type="password"
            InputProps={{ startAdornment: adornmentLock }}
          />
          <TextField
            error={Boolean(errors.nextPasswordRepeat)}
            label={
              errors.nextPasswordRepeat
                ? renderFormFieldError(errors.nextPasswordRepeat)
                : t("set-password.textfield.next-password-repeat.label")
            }
            fullWidth
            margin="normal"
            value={formValues.nextPasswordRepeat}
            onChange={event => setFormValue("nextPasswordRepeat", event.target.value)}
            type="password"
            InputProps={{ startAdornment: adornmentLock }}
          />
        </Box>
      </Box>
    </DialogBody>
  )
}

export default React.memo(ChangePasswordDialog)
