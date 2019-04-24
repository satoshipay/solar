import React from "react"
import InputAdornment from "@material-ui/core/InputAdornment"
import TextField from "@material-ui/core/TextField"
import Typography from "@material-ui/core/Typography"
import CheckIcon from "@material-ui/icons/Check"
import EditIcon from "@material-ui/icons/Edit"
import { Keypair } from "stellar-sdk"
import { Account } from "../../context/accounts"
import { useIsMobile, useIsSmallMobile } from "../../hooks"
import { renderFormFieldError } from "../../lib/errors"
import { ActionButton, CloseButton, DialogActionsBox } from "../Dialog/Generic"
import { Box, HorizontalLayout, VerticalLayout } from "../Layout/Box"
import ToggleSection from "../Layout/ToggleSection"
import { QRReader } from "./FormFields"

export interface AccountCreationValues {
  name: string
  password: string
  passwordRepeat: string
  privateKey: string
  createNewKey: boolean
  setPassword: boolean
}

type AccountCreationErrors = { [fieldName in keyof AccountCreationValues]?: Error | null }

function getNewAccountName(accounts: Account[], testnet?: boolean) {
  const baseName = `My ${testnet ? "Testnet " : ""}Account`
  const deriveName = (idx: number) => (idx === 0 ? baseName : `${baseName} ${idx + 1}`)

  let index = 0

  // Find an account name that is not in use yet
  while (accounts.some(account => account.name === deriveName(index))) {
    index++
  }

  return deriveName(index)
}

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
  onSubmit(event: React.SyntheticEvent): void
  setFormValue<FieldName extends keyof AccountCreationValues>(
    fieldName: FieldName,
    value: AccountCreationValues[FieldName]
  ): void
}

function AccountCreationForm(props: AccountCreationFormProps) {
  const { errors, formValues, setFormValue } = props
  const isSmallScreen = useIsMobile()
  const isTinyScreen = useIsSmallMobile()
  const primaryButtonLabel = formValues.createNewKey
    ? isSmallScreen
      ? "Create"
      : "Create Account"
    : isSmallScreen
      ? "Import"
      : "Import Account"

  const onQRImport = (key: string) => {
    setFormValue("privateKey", key)
    setFormValue("createNewKey", false)
  }

  return (
    <form onSubmit={props.onSubmit}>
      <VerticalLayout minHeight="400px" justifyContent="space-between" style={{ marginLeft: -6, marginRight: 6 }}>
        <Box>
          <TextField
            error={Boolean(errors.name)}
            label={errors.name ? renderFormFieldError(errors.name) : undefined}
            placeholder={props.testnet ? "New Testnet Account" : "New Account"}
            autoFocus={process.env.PLATFORM !== "ios"}
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
                fontSize: isTinyScreen ? "1.3rem" : "1.5rem"
              }
            }}
            style={{ minWidth: isTinyScreen ? 230 : 300, maxWidth: "70%", margin: 0, paddingLeft: 12 }}
          />
        </Box>
        <ToggleSection
          checked={formValues.setPassword}
          onChange={() => setFormValue("setPassword", !formValues.setPassword)}
          title="Password Protect"
        >
          <>
            <Typography
              color={formValues.setPassword ? "default" : "textSecondary"}
              variant="body2"
              style={{ margin: "8px 0 0" }}
            >
              <b>Note:</b> The key to your account will be encrypted using the password you set here. If you forget your
              password, your funds will be lost unless you have a backup of your private key! You can export your
              private key at any time.
            </Typography>

            <HorizontalLayout
              wrap="wrap"
              style={{
                marginLeft: isSmallScreen ? -6 : -16,
                marginRight: isSmallScreen ? -6 : -16
              }}
            >
              <TextField
                disabled={!formValues.setPassword}
                error={Boolean(errors.password)}
                fullWidth
                label={errors.password ? renderFormFieldError(errors.password) : "Password"}
                placeholder="Enter a password"
                margin="normal"
                onChange={event => setFormValue("password", event.target.value)}
                style={{
                  flex: "1 0 0",
                  marginLeft: isSmallScreen ? 6 : 16,
                  marginRight: isSmallScreen ? 6 : 16,
                  minWidth: isTinyScreen ? 150 : 250
                }}
                type="password"
                value={formValues.password}
              />
              <TextField
                disabled={!formValues.setPassword}
                error={Boolean(errors.passwordRepeat)}
                fullWidth
                label={errors.passwordRepeat ? renderFormFieldError(errors.passwordRepeat) : "Repeat password"}
                margin="normal"
                onChange={event => setFormValue("passwordRepeat", event.target.value)}
                placeholder="Repeat your password"
                style={{
                  flex: "1 0 0",
                  marginLeft: isSmallScreen ? 6 : 16,
                  marginRight: isSmallScreen ? 6 : 16,
                  minWidth: isTinyScreen ? 150 : 250
                }}
                type="password"
                value={formValues.passwordRepeat}
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
              label={errors.privateKey ? renderFormFieldError(errors.privateKey) : "Secret key"}
              placeholder="SABCDEFGH…"
              fullWidth
              margin="normal"
              value={formValues.privateKey}
              onChange={event => setFormValue("privateKey", event.target.value)}
              inputProps={{
                style: { textOverflow: "ellipsis" }
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment disableTypography position="end">
                    <QRReader iconStyle={{ fontSize: 20 }} onScan={onQRImport} />
                  </InputAdornment>
                )
              }}
            />
          </HorizontalLayout>
        </ToggleSection>
        <DialogActionsBox desktopStyle={{ marginTop: 64 }}>
          <CloseButton onClick={props.onCancel} />
          <ActionButton icon={<CheckIcon />} onClick={props.onSubmit} type="submit">
            {primaryButtonLabel}
          </ActionButton>
        </DialogActionsBox>
      </VerticalLayout>
    </form>
  )
}

interface Props {
  accounts: Account[]
  testnet: boolean
  onCancel(): void
  onSubmit(formValues: AccountCreationValues): void
}

function StatefulAccountCreationForm(props: Props) {
  const defaultAccountName = React.useMemo(() => getNewAccountName(props.accounts, props.testnet), [])
  const [errors, setErrors] = React.useState<AccountCreationErrors>({})
  const [formValues, setFormValues] = React.useState<AccountCreationValues>({
    name: defaultAccountName,
    password: "",
    passwordRepeat: "",
    privateKey: "",
    createNewKey: true,
    setPassword: true
  })

  const setFormValue = (fieldName: keyof AccountCreationValues, value: string) => {
    setFormValues(prevValues => ({
      ...prevValues,
      [fieldName]: value
    }))
  }

  const submit = (event: React.SyntheticEvent) => {
    event.preventDefault()

    const validation = validateFormValues(formValues)
    setErrors(validation.errors)

    const privateKey = formValues.createNewKey ? Keypair.random().secret() : formValues.privateKey

    if (validation.success) {
      props.onSubmit({ ...formValues, privateKey })
    }
  }

  return (
    <AccountCreationForm
      errors={errors}
      formValues={formValues}
      testnet={props.testnet}
      onCancel={props.onCancel}
      onSubmit={submit}
      setFormValue={setFormValue}
    />
  )
}

export default StatefulAccountCreationForm
