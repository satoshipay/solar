import React from "react"
import { useTranslation } from "react-i18next"
import DialogActions from "@material-ui/core/DialogActions"
import FormControlLabel from "@material-ui/core/FormControlLabel"
import InputAdornment from "@material-ui/core/InputAdornment"
import Switch from "@material-ui/core/Switch"
import LockIcon from "@material-ui/icons/LockOutlined"
import LockOpenIcon from "@material-ui/icons/LockOpenOutlined"
import { Account, AccountsContext } from "~App/contexts/accounts"
import { NotificationsContext } from "~App/contexts/notifications"
import { useIsMobile } from "~Generic/hooks/userinterface"
import { renderFormFieldError, isWrongPasswordError } from "~Generic/lib/errors"
import { ActionButton, DialogActionsBox } from "~Generic/components/DialogActions"
import MainTitle from "~Generic/components/MainTitle"
import PasswordField from "~Generic/components/PasswordField"
import { Box, HorizontalLayout } from "~Layout/components/Box"
import DialogBody from "~Layout/components/DialogBody"

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
      errors.prevPassword = new Error(t("account-settings.set-password.validation.previous-password-missing"))
    }
    if (passwordMode !== "remove") {
      if (!formValues.nextPassword) {
        errors.nextPassword = new Error(t("account-settings.set-password.validation.next-password-missing"))
      }
      if (!formValues.nextPasswordRepeat) {
        errors.nextPasswordRepeat = new Error(
          t("account-settings.set-password.validation.next-password-repeat-missing")
        )
      }
      if (formValues.nextPasswordRepeat && formValues.nextPassword !== formValues.nextPasswordRepeat) {
        errors.nextPasswordRepeat = new Error(t("account-settings.set-password.validation.passwords-no-match"))
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
  testnet?: boolean
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
              ? t("account-settings.set-password.action.change-password.long")
              : t("account-settings.set-password.action.remove-password.long")}
          </ActionButton>
        ) : (
          <FormControlLabel
            control={<Switch checked={props.removePassword} color="primary" onChange={props.onToggleRemovePassword} />}
            label={t("account-settings.set-password.action.remove-password.long")}
          />
        )
      ) : null}
      <ActionButton icon={<LockIcon />} onClick={props.onSubmit} testnet={props.testnet} type="primary">
        {isSmallScreen
          ? props.removePassword
            ? t("account-settings.set-password.action.remove-password.long")
            : t("account-settings.set-password.action.change-password.short")
          : props.removePassword
          ? t("account-settings.set-password.action.remove-password.long")
          : t("account-settings.set-password.action.change-password.long")}
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
              ? t("account-settings.set-password.notification.password-changed")
              : t("account-settings.set-password.notification.password-set")
          )
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
    const validation = validate(formValues, "remove")
    setErrors(validation.errors)

    if (validation.success) {
      // TODO: Show confirmation prompt (dialog)
      Accounts.removePassword(props.account.id, formValues.prevPassword)
        .then(() => {
          showNotification("success", t("account-settings.set-password.notification.password-removed"))
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
    <DialogBody
      noMaxWidth
      preventNotchSpacing
      top={
        <MainTitle
          hideBackButton
          onBack={onClose}
          title={
            props.account.requiresPassword
              ? t("account-settings.set-password.title.change-password")
              : t("account-settings.set-password.title.set-password")
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
            testnet={props.account.testnet}
          />
        </DialogActions>
      }
    >
      <HorizontalLayout
        alignSelf="center"
        justifyContent="space-evenly"
        margin="24px 0 0"
        width="calc(100% + 16px)"
        wrap="wrap"
      >
        <Box basis="400px" grow={0} hidden={!props.account.requiresPassword} margin="0 16px" shrink>
          <PasswordField
            autoFocus={props.account.requiresPassword && process.env.PLATFORM !== "ios"}
            error={Boolean(errors.prevPassword)}
            label={
              errors.prevPassword
                ? renderFormFieldError(errors.prevPassword, t)
                : t("account-settings.set-password.textfield.prev-password.label")
            }
            fullWidth
            margin="normal"
            value={formValues.prevPassword}
            onChange={event => setFormValue("prevPassword", event.target.value)}
            InputProps={{ startAdornment: adornmentLockOpen }}
          />
        </Box>
        <Box basis="400px" grow={0} hidden={removingPassword} margin="0 16px" shrink>
          <PasswordField
            autoFocus={!props.account.requiresPassword && process.env.PLATFORM !== "ios"}
            error={Boolean(errors.nextPassword)}
            label={
              errors.nextPassword
                ? renderFormFieldError(errors.nextPassword, t)
                : t("account-settings.set-password.textfield.next-password.label")
            }
            fullWidth
            margin="normal"
            value={formValues.nextPassword}
            onChange={event => setFormValue("nextPassword", event.target.value)}
            InputProps={{ startAdornment: adornmentLock }}
          />
          <PasswordField
            error={Boolean(errors.nextPasswordRepeat)}
            label={
              errors.nextPasswordRepeat
                ? renderFormFieldError(errors.nextPasswordRepeat, t)
                : t("account-settings.set-password.textfield.next-password-repeat.label")
            }
            fullWidth
            margin="normal"
            value={formValues.nextPasswordRepeat}
            onChange={event => setFormValue("nextPasswordRepeat", event.target.value)}
            InputProps={{ startAdornment: adornmentLock }}
          />
        </Box>
      </HorizontalLayout>
    </DialogBody>
  )
}

export default React.memo(ChangePasswordDialog)
