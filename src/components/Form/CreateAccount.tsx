import React from "react"
import Button from "@material-ui/core/Button"
import FormControlLabel from "@material-ui/core/FormControlLabel"
import FormGroup from "@material-ui/core/FormGroup"
import InputAdornment from "@material-ui/core/InputAdornment"
import Switch from "@material-ui/core/Switch"
import TextField from "@material-ui/core/TextField"
import LabelIcon from "@material-ui/icons/LabelOutlined"
import LockIcon from "@material-ui/icons/LockOutlined"
import WalletIcon from "@material-ui/icons/AccountBalanceWalletOutlined"
import AddIcon from "react-icons/lib/md/add"
import { Keypair } from "stellar-sdk"
import {
  addFormState,
  InnerFormProps,
  renderError
} from "../../lib/formHandling"
import { Box, HorizontalLayout } from "../Layout/Box"

export interface AccountCreationValues {
  name: string
  password: string
  passwordRepeat: string
  privateKey: string
  createNewKey: boolean
  setPassword: boolean
}

const validateAccountName = (accountName: string) => {
  if (!accountName) {
    return new Error("No account name has been entered.")
  }
}

const validatePassword = (password: string, values: AccountCreationValues) => {
  if (values.setPassword && !password) {
    return new Error("No password has been entered.")
  }
}

const validatePasswordRepeat = (
  passwordRepeat: string,
  values: AccountCreationValues
) => {
  if (values.setPassword && passwordRepeat !== values.password) {
    return new Error("Password does not match.")
  }
}

const validatePrivateKey = (
  privateKey: string,
  values: AccountCreationValues
) => {
  if (!values.createNewKey && !privateKey.match(/^S[A-Z0-9]{55}$/)) {
    return new Error("Invalid stellar public key.")
  }
}

interface AccountCreationFormProps {
  onSubmit(formValues: AccountCreationValues): void
}

const AccountCreationForm = (
  props: InnerFormProps<AccountCreationValues> & AccountCreationFormProps
) => {
  const { errors, formValues, onSubmit, setFormValue, validate } = props
  const triggerSubmit = () => {
    if (!validate(props.formValues)) return

    const privateKey = formValues.createNewKey
      ? Keypair.random().secret()
      : formValues.privateKey
    onSubmit({ ...formValues, privateKey })
  }
  const handleSubmitEvent = (event: React.SyntheticEvent) => {
    event.preventDefault()
    triggerSubmit()
  }
  return (
    <form onSubmit={handleSubmitEvent}>
      <TextField
        error={Boolean(errors.name)}
        label={errors.name ? renderError(errors.name) : "Account name"}
        fullWidth
        autoFocus
        margin="dense"
        value={formValues.name}
        onChange={event => setFormValue("name", event.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <LabelIcon color="disabled" />
            </InputAdornment>
          )
        }}
      />
      <TextField
        error={Boolean(errors.password)}
        label={errors.password ? renderError(errors.password) : "Password"}
        fullWidth
        margin="dense"
        value={formValues.password}
        onChange={event => setFormValue("password", event.target.value)}
        style={{ display: formValues.setPassword ? "block" : "none" }}
        type="password"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <LockIcon color="disabled" />
            </InputAdornment>
          )
        }}
      />
      <TextField
        error={Boolean(errors.passwordRepeat)}
        label={
          errors.passwordRepeat
            ? renderError(errors.passwordRepeat)
            : "Repeat password"
        }
        fullWidth
        margin="dense"
        value={formValues.passwordRepeat}
        onChange={event => setFormValue("passwordRepeat", event.target.value)}
        style={{ display: formValues.setPassword ? "block" : "none" }}
        type="password"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <LockIcon color="disabled" />
            </InputAdornment>
          )
        }}
      />
      <TextField
        error={Boolean(errors.privateKey)}
        label={
          errors.privateKey ? renderError(errors.privateKey) : "Private key"
        }
        placeholder="SABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ABCDEFGHIJKLMNOPQRS"
        fullWidth
        margin="dense"
        value={formValues.privateKey}
        onChange={event => setFormValue("privateKey", event.target.value)}
        style={{ display: formValues.createNewKey ? "none" : "block" }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <WalletIcon color="disabled" />
            </InputAdornment>
          )
        }}
      />
      <FormGroup row>
        <FormControlLabel
          control={
            <Switch
              checked={formValues.setPassword}
              onChange={() =>
                setFormValue("setPassword", !formValues.setPassword as any)
              }
            />
          }
          label="Set password"
          style={{ marginTop: 16 }}
        />
        <FormControlLabel
          control={
            <Switch
              checked={!formValues.createNewKey}
              onChange={() =>
                setFormValue("createNewKey", !formValues.createNewKey as any)
              }
            />
          }
          label="Import existing key"
          style={{ marginTop: 16 }}
        />
      </FormGroup>
      <Box margin="16px 0">
        Security note:<br />
        The key to your account will be encrypted using the password you set
        here. If you forget your password, your funds will be lost unless you
        have a backup of your private key!
      </Box>
      <HorizontalLayout justifyContent="end" margin="24px 0 0">
        <Button
          variant="contained"
          color="primary"
          onClick={triggerSubmit}
          type="submit"
        >
          <AddIcon style={{ marginRight: 8, marginTop: -2 }} />
          Add account
        </Button>
      </HorizontalLayout>
    </form>
  )
}

const StatefulAccountCreationForm = addFormState<
  AccountCreationValues,
  AccountCreationFormProps
>({
  defaultValues: {
    name: "",
    password: "",
    passwordRepeat: "",
    privateKey: "",
    createNewKey: true,
    setPassword: true
  },
  validators: {
    name: validateAccountName,
    password: validatePassword,
    passwordRepeat: validatePasswordRepeat,
    privateKey: validatePrivateKey
  }
})(AccountCreationForm)

export default StatefulAccountCreationForm
