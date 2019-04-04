import React from "react"
import TextField from "@material-ui/core/TextField"
import CheckIcon from "@material-ui/icons/Check"
import { Transaction } from "stellar-sdk"
import { Account } from "../../context/accounts"
import { renderFormFieldError } from "../../lib/errors"
import { SignatureRequest } from "../../lib/multisig-service"
import { ActionButton, DialogActionsBox } from "../Dialog/Generic"
import { VerticalLayout } from "../Layout/Box"
import TransactionSummary from "../TransactionSummary/TransactionSummary"

type FormErrors = { [formField in keyof FormValues]: Error | null }

interface FormValues {
  password: string | null
}

interface Props {
  account: Account
  disabled?: boolean
  passwordError?: Error | null
  signatureRequest?: SignatureRequest
  transaction: Transaction
  onConfirm?: (formValues: FormValues) => any
}

function TxConfirmationForm(props: Props) {
  const { onConfirm = () => undefined } = props

  const [errors, setErrors] = React.useState<Partial<FormErrors>>({})
  const [formValues, setFormValues] = React.useState<FormValues>({ password: null })

  const passwordError = props.passwordError || errors.password

  const setFormValue = <Key extends keyof FormValues>(key: keyof FormValues, value: FormValues[Key]) => {
    setFormValues(prevValues => ({
      ...prevValues,
      [key]: value
    }))
  }

  const onSubmit = (event: React.SyntheticEvent) => {
    if (props.disabled) {
      // Just a precaution; we shouldn't even get here if the component is disabled
      return
    }

    if (props.account.requiresPassword && !formValues.password) {
      return setErrors({
        ...errors,
        password: new Error("Password required")
      })
    }

    event.preventDefault()
    setErrors({})
    onConfirm(formValues)
  }

  return (
    <form onSubmit={onSubmit}>
      <VerticalLayout>
        <TransactionSummary
          account={props.account}
          showSource={props.account.publicKey !== props.transaction.source}
          signatureRequest={props.signatureRequest}
          testnet={props.account.testnet}
          transaction={props.transaction}
        />
        {props.account.requiresPassword && !props.disabled ? (
          <TextField
            error={Boolean(passwordError)}
            label={passwordError ? renderFormFieldError(passwordError) : "Password"}
            type="password"
            autoFocus
            fullWidth
            margin="dense"
            value={formValues.password || ""}
            onChange={event => setFormValue("password", event.target.value)}
            style={{ marginBottom: 32 }}
          />
        ) : null}
        <DialogActionsBox style={{ justifyContent: "center" }}>
          {props.disabled ? null : (
            <ActionButton icon={<CheckIcon />} onClick={() => undefined} type="submit">
              Confirm
            </ActionButton>
          )}
        </DialogActionsBox>
      </VerticalLayout>
    </form>
  )
}

export default TxConfirmationForm
