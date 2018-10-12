import React from "react"
import Button from "@material-ui/core/Button"
import InputAdornment from "@material-ui/core/InputAdornment"
import TextField from "@material-ui/core/TextField"
import Typography from "@material-ui/core/Typography"
import CheckIcon from "@material-ui/icons/Check"
import CloseIcon from "@material-ui/icons/Close"
import EditIcon from "@material-ui/icons/Edit"
import { Keypair } from "stellar-sdk"
import { renderFormFieldError } from "../../lib/errors"
import { addError } from "../../stores/notifications"
import QRImportDialog from "../Dialog/QRImport"
import QRCodeIcon from "../Icon/QRCode"
import { Box, HorizontalLayout, VerticalLayout } from "../Layout/Box"
import { HorizontalMargin } from "../Layout/Spacing"
import ToggleSection from "../Layout/ToggleSection"

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
  onCancel(): void
  onOpenQRScanner(): void
  onSubmit(event: React.SyntheticEvent): void
  setFormValue(fieldName: keyof AccountCreationValues, value: string): void
}

const AccountCreationForm = (props: AccountCreationFormProps) => {
  const { errors, formValues, setFormValue } = props
  return (
    <form onSubmit={props.onSubmit}>
      <VerticalLayout minHeight="400px" maxHeight="80vh" justifyContent="space-between">
        <Box>
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
              endAdornment: (
                <InputAdornment position="end">
                  <EditIcon />
                </InputAdornment>
              ),
              style: {
                color: "rgba(0, 0, 0, 0.54)",
                fontSize: "1.5rem"
              }
            }}
            style={{ minWidth: 300, maxWidth: "70%", margin: 0 }}
          />
        </Box>
        <ToggleSection
          checked={formValues.setPassword}
          onChange={() => setFormValue("setPassword", !formValues.setPassword as any)}
          title="Password Protect"
        >
          <>
            <Typography
              color={formValues.setPassword ? "default" : "textSecondary"}
              variant="body1"
              style={{ margin: "12px 0 0" }}
            >
              <b>Note:</b> The key to your account will be encrypted using the password you set here. If you forget your
              password, your funds will be lost unless you have a backup of your private key! You can export your
              private key at any time.
            </Typography>

            <HorizontalLayout>
              <TextField
                disabled={!formValues.setPassword}
                error={Boolean(errors.password)}
                label={errors.password ? renderFormFieldError(errors.password) : "Password"}
                fullWidth
                margin="normal"
                value={formValues.password}
                onChange={event => setFormValue("password", event.target.value)}
                type="password"
              />
              <HorizontalMargin size={32} />
              <TextField
                disabled={!formValues.setPassword}
                error={Boolean(errors.passwordRepeat)}
                label={errors.passwordRepeat ? renderFormFieldError(errors.passwordRepeat) : "Repeat password"}
                margin="normal"
                fullWidth
                value={formValues.passwordRepeat}
                onChange={event => setFormValue("passwordRepeat", event.target.value)}
                type="password"
              />
            </HorizontalLayout>
          </>
        </ToggleSection>
        <ToggleSection
          checked={!formValues.createNewKey}
          onChange={() => setFormValue("createNewKey", !formValues.createNewKey as any)}
          title="Import Existing"
        >
          <HorizontalLayout alignItems="center">
            <TextField
              disabled={Boolean(formValues.createNewKey)}
              error={Boolean(errors.privateKey)}
              label={errors.privateKey ? renderFormFieldError(errors.privateKey) : "Private key"}
              placeholder="SABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ABCDEFGHIJKLMNOPQRS"
              fullWidth
              margin="normal"
              value={formValues.privateKey}
              onChange={event => setFormValue("privateKey", event.target.value)}
            />
            <HorizontalMargin size={32} />
            <Button
              disabled={Boolean(formValues.createNewKey)}
              variant="outlined"
              onClick={props.onOpenQRScanner}
              style={{ height: 48 }}
            >
              <QRCodeIcon style={{ marginRight: 16 }} />
              Scan
            </Button>
          </HorizontalLayout>
        </ToggleSection>
        <HorizontalLayout justifyContent="end" alignItems="center" margin="64px 0 0" width="auto">
          <Button variant="contained" onClick={props.onCancel}>
            <CloseIcon style={{ marginRight: 8, marginTop: -2 }} />
            Cancel
          </Button>
          <HorizontalMargin size={16} />
          <Button color="primary" variant="contained" onClick={props.onSubmit} type="submit">
            <CheckIcon style={{ marginRight: 8, marginTop: -2 }} />
            {formValues.createNewKey ? "Create Account" : "Import Account"}
          </Button>
        </HorizontalLayout>
      </VerticalLayout>
    </form>
  )
}

interface Props {
  testnet: boolean
  onCancel(): void
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
          onCancel={this.props.onCancel}
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
