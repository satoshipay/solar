import React from "react"
import Button from "@material-ui/core/Button"
import FormControlLabel from "@material-ui/core/FormControlLabel"
import FormGroup from "@material-ui/core/FormGroup"
import IconButton from "@material-ui/core/IconButton"
import InputAdornment from "@material-ui/core/InputAdornment"
import Switch from "@material-ui/core/Switch"
import TextField from "@material-ui/core/TextField"
import AddIcon from "@material-ui/icons/Add"
import LockIcon from "@material-ui/icons/LockOutlined"
import WalletIcon from "@material-ui/icons/AccountBalanceWalletOutlined"
import { Keypair } from "stellar-sdk"
import { renderFormFieldError } from "../../lib/errors"
import { addError } from "../../stores/notifications"
import QRImportDialog from "../Dialog/QRImport"
import QRCodeIcon from "../Icon/QRCode"
import { Box, HorizontalLayout } from "../Layout/Box"

export interface AccountCreationValues {
  name: string
  password: string
  passwordRepeat: string
  privateKey: string
  createNewKey: boolean
  setPassword: boolean
}

type AccountCreationErrors = { [fieldName in keyof AccountCreationValues]?: Error | null }

function validateFormValues(formValues: AccountCreationValues) {
  const errors: AccountCreationErrors = {}

  if (!formValues.name) {
    errors.name = new Error("No account name has been entered.")
  }
  if (formValues.setPassword && !formValues.password) {
    errors.password = new Error("No password has been entered.")
  }
  if (formValues.setPassword && formValues.passwordRepeat !== formValues.password) {
    errors.passwordRepeat = new Error("Password does not match.")
  }
  if (!formValues.createNewKey && !formValues.privateKey.match(/^S[A-Z0-9]{55}$/)) {
    errors.privateKey = new Error("Invalid stellar private key.")
  }

  const success = Object.keys(errors).length === 0
  return { errors, success }
}

interface AccountCreationFormProps {
  errors: AccountCreationErrors
  formValues: AccountCreationValues
  testnet: boolean
  onOpenQRScanner(): void
  onSubmit(event: React.SyntheticEvent): void
  setFormValue(fieldName: keyof AccountCreationValues, value: string): void
}

const AccountCreationForm = (props: AccountCreationFormProps) => {
  const { errors, formValues, setFormValue } = props
  return (
    <form onSubmit={props.onSubmit}>
      <TextField
        error={Boolean(errors.name)}
        label={errors.name ? renderFormFieldError(errors.name) : undefined}
        placeholder={props.testnet ? "New Testnet Account" : "New Account"}
        autoFocus
        margin="normal"
        value={formValues.name}
        onChange={event => setFormValue("name", event.target.value)}
        InputProps={{
          disableUnderline: true,
          style: {
            color: "rgba(0, 0, 0, 0.54)",
            fontSize: "1.5rem"
          }
        }}
        style={{ width: 300, margin: 0, marginBottom: 20 }}
      />
      <Box width="50%">
        <TextField
          error={Boolean(errors.password)}
          label={errors.password ? renderFormFieldError(errors.password) : "Password"}
          placeholder="Enter a password"
          fullWidth
          margin="normal"
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
          label={errors.passwordRepeat ? renderFormFieldError(errors.passwordRepeat) : "Repeat password"}
          placeholder="Repeat password here"
          fullWidth
          margin="normal"
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
          label={errors.privateKey ? renderFormFieldError(errors.privateKey) : "Private key"}
          placeholder="SABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ABCDEFGHIJKLMNOPQRS"
          fullWidth
          margin="normal"
          value={formValues.privateKey}
          onChange={event => setFormValue("privateKey", event.target.value)}
          style={{ display: formValues.createNewKey ? "none" : "block" }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <WalletIcon color="disabled" />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={props.onOpenQRScanner} title="Scan QR code">
                  <QRCodeIcon />
                </IconButton>
              </InputAdornment>
            )
          }}
        />
      </Box>
      <Box margin="24px 0 0">
        Security note:
        <br />
        The key to your account will be encrypted using the password you set here. If you forget your password, your
        funds will be lost unless you have a backup of your private key!
      </Box>
      <HorizontalLayout justifyContent="space-between" margin="24px 0 0" wrap="wrap">
        <FormGroup row>
          <FormControlLabel
            control={
              <Switch
                checked={formValues.setPassword}
                color="primary"
                onChange={() => setFormValue("setPassword", !formValues.setPassword as any)}
              />
            }
            label="Set password"
          />
          <FormControlLabel
            control={
              <Switch
                checked={!formValues.createNewKey}
                color="primary"
                onChange={() => setFormValue("createNewKey", !formValues.createNewKey as any)}
              />
            }
            label="Import existing key"
          />
        </FormGroup>
        <HorizontalLayout justifyContent="end" alignItems="center" width="auto">
          <Button variant="contained" color="primary" onClick={props.onSubmit} type="submit">
            <AddIcon style={{ marginRight: 8, marginTop: -2 }} />
            Add account
          </Button>
        </HorizontalLayout>
      </HorizontalLayout>
    </form>
  )
}

interface Props {
  testnet: boolean
  onSubmit(formValues: AccountCreationValues): void
}

interface State {
  errors: AccountCreationErrors
  formValues: AccountCreationValues
  qrScannerOpen: boolean
}

class StatefulAccountCreationForm extends React.Component<Props, State> {
  state: State = {
    errors: {},
    formValues: {
      name: "",
      password: "",
      passwordRepeat: "",
      privateKey: "",
      createNewKey: true,
      setPassword: true
    },
    qrScannerOpen: false
  }

  closeQRScanner = () => {
    this.setState({ qrScannerOpen: false })
  }

  openQRScanner = () => {
    this.setState({ qrScannerOpen: true })
  }

  privateKeyScanned = (secretKey: string | null) => {
    if (secretKey) {
      this.setFormValue("privateKey", secretKey)
      this.closeQRScanner()
    }
  }

  setFormValue = (fieldName: keyof AccountCreationValues, value: string) => {
    this.setState({
      formValues: {
        ...this.state.formValues,
        [fieldName]: value
      }
    })
  }

  submit = (event: React.SyntheticEvent) => {
    event.preventDefault()

    const { errors, success } = validateFormValues(this.state.formValues)
    this.setState({ errors })

    const { formValues } = this.state
    const privateKey = formValues.createNewKey ? Keypair.random().secret() : formValues.privateKey

    if (success) {
      this.props.onSubmit({ ...formValues, privateKey })
    }
  }

  render() {
    return (
      <>
        <AccountCreationForm
          errors={this.state.errors}
          formValues={this.state.formValues}
          testnet={this.props.testnet}
          onOpenQRScanner={this.openQRScanner}
          onSubmit={this.submit}
          setFormValue={this.setFormValue}
        />
        <QRImportDialog
          open={this.state.qrScannerOpen}
          onClose={this.closeQRScanner}
          onError={addError}
          onScan={this.privateKeyScanned}
        />
      </>
    )
  }
}

export default StatefulAccountCreationForm
