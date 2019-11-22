import React from "react"
import IconButton from "@material-ui/core/IconButton"
import InputAdornment from "@material-ui/core/InputAdornment"
import TextField from "@material-ui/core/TextField"
import Typography from "@material-ui/core/Typography"
import CheckIcon from "@material-ui/icons/Check"
import EditIcon from "@material-ui/icons/Edit"
import { Keypair } from "stellar-sdk"
import { Account } from "../../context/accounts"
import { useIsMobile, useIsSmallMobile } from "../../hooks/userinterface"
import { renderFormFieldError } from "../../lib/errors"
import { ActionButton, CloseButton, DialogActionsBox, ConfirmDialog } from "../Dialog/Generic"
import { HorizontalLayout } from "../Layout/Box"
import ToggleSection from "../Layout/ToggleSection"
import { QRReader } from "./FormFields"
import DialogBody from "../Dialog/DialogBody"

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

function isAccountAlreadyImported(privateKey: string, accounts: Account[]) {
  const publicKey = Keypair.fromSecret(privateKey).publicKey()
  return accounts.some(account => account.publicKey === publicKey)
}

function validateFormValues(formValues: AccountCreationValues, accounts: Account[]) {
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
  } else if (!formValues.createNewKey && isAccountAlreadyImported(formValues.privateKey, accounts)) {
    errors.privateKey = new Error("You cannot import the same account twice.")
  }

  const success = Object.keys(errors).length === 0
  return { errors, success }
}

interface AccountCreationFormProps {
  errors: AccountCreationErrors
  formValues: AccountCreationValues
  testnet: boolean
  onCancel(): void
  onSubmit(): void
  setFormValue<FieldName extends keyof AccountCreationValues>(
    fieldName: FieldName,
    value: AccountCreationValues[FieldName]
  ): void
}

function AccountCreationForm(props: AccountCreationFormProps) {
  const { errors, formValues, setFormValue } = props

  const inputRef = React.useRef<HTMLInputElement | undefined>()
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

  const headerContent = React.useMemo(
    () => (
      <Typography variant="h5" style={{ display: "flex" }}>
        <TextField
          autoFocus={process.env.PLATFORM !== "ios"}
          error={Boolean(errors.name)}
          inputRef={inputRef}
          label={errors.name ? renderFormFieldError(errors.name) : undefined}
          margin="normal"
          onChange={event => setFormValue("name", event.target.value)}
          placeholder={props.testnet ? "New Testnet Account" : "New Account"}
          value={formValues.name}
          InputProps={{
            disableUnderline: true,
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => inputRef.current && inputRef.current.focus()}>
                  <EditIcon />
                </IconButton>
              </InputAdornment>
            ),
            style: {
              fontFamily: "inherit",
              fontSize: isTinyScreen ? "1.3rem" : "1.5rem",
              fontWeight: "inherit"
            }
          }}
          style={{ minWidth: isTinyScreen ? 230 : 300, maxWidth: "70%", margin: 0 }}
        />
      </Typography>
    ),
    [errors, formValues, isTinyScreen, props.testnet]
  )

  const actionsContent = React.useMemo(
    () => (
      <DialogActionsBox desktopStyle={{ marginTop: 40 }}>
        <CloseButton onClick={props.onCancel} />
        <ActionButton icon={<CheckIcon />} onClick={props.onSubmit} type="primary">
          {primaryButtonLabel}
        </ActionButton>
      </DialogActionsBox>
    ),
    [primaryButtonLabel, props.onCancel, props.onSubmit]
  )

  return (
    <form noValidate onSubmit={props.onSubmit} style={{ display: "block", height: "100vh" }}>
      <DialogBody top={headerContent} actions={actionsContent}>
        <ToggleSection
          checked={formValues.setPassword}
          onChange={() => setFormValue("setPassword", !formValues.setPassword)}
          style={{ marginTop: 24, flexShrink: 0 }}
          title="Password Protect"
        >
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
              helperText={
                errors.privateKey ? "A Stellar secret key is 56 alphanumeric characters long and starts with an S" : " "
              }
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
                    <QRReader onScan={onQRImport} />
                  </InputAdornment>
                )
              }}
            />
          </HorizontalLayout>
        </ToggleSection>
      </DialogBody>
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
  const [pendingConfirmation, setPendingConfirmation] = React.useState<boolean>(false)
  const [formValues, setFormValues] = React.useState<AccountCreationValues>({
    name: defaultAccountName,
    password: "",
    passwordRepeat: "",
    privateKey: "",
    createNewKey: true,
    setPassword: true
  })

  const setFormValue = (
    fieldName: keyof AccountCreationValues,
    value: AccountCreationValues[keyof AccountCreationValues]
  ) => {
    setFormValues(prevValues => ({
      ...prevValues,
      [fieldName]: value
    }))
  }

  const validate = () => {
    const validation = validateFormValues(formValues, props.accounts)
    setErrors(validation.errors)

    if (validation.success) {
      if (!props.testnet && !formValues.setPassword) {
        setPendingConfirmation(true)
      } else {
        submit()
      }
    }
  }

  const submit = () => {
    const privateKey = formValues.createNewKey ? Keypair.random().secret() : formValues.privateKey
    props.onSubmit({ ...formValues, privateKey })
  }

  const onConfirmNoPasswordProtection = () => {
    if (!pendingConfirmation) return

    submit()
    setPendingConfirmation(false)
  }

  return (
    <>
      <AccountCreationForm
        errors={errors}
        formValues={formValues}
        testnet={props.testnet}
        onCancel={props.onCancel}
        onSubmit={validate}
        setFormValue={setFormValue}
      />
      <ConfirmDialog
        cancelButton={<ActionButton onClick={() => setPendingConfirmation(false)}>Cancel</ActionButton>}
        confirmButton={
          <ActionButton onClick={onConfirmNoPasswordProtection} type="primary">
            Confirm
          </ActionButton>
        }
        onClose={() => setPendingConfirmation(false)}
        open={pendingConfirmation}
        title="Continue without password"
      >
        You are about to create an account without password protection. Anyone that has access to your device will have
        access to your account funds. <br /> <br />
        Are you sure you want to continue without setting up a password?
      </ConfirmDialog>
    </>
  )
}

export default StatefulAccountCreationForm
