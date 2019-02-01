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
  onCancel?: () => any
}

interface State {
  errors: Partial<{ [formField in keyof FormValues]: Error | null }>
  formValues: FormValues
}

class TxConfirmationForm extends React.Component<Props, State> {
  state: State = {
    errors: {},
    formValues: {
      password: null
    }
  }

  setFormValue = <Key extends keyof FormValues>(key: keyof FormValues, value: FormValues[Key]) => {
    this.setState({
      formValues: {
        ...this.state.formValues,
        [key]: value
      }
    })
  }

  onSubmit = (event: React.SyntheticEvent) => {
    const { onConfirm = () => undefined } = this.props
    const { errors, formValues } = this.state

    if (this.props.disabled) {
      // Just a precaution; we shouldn't even get here if the component is disabled
      return
    }

    if (this.props.account.requiresPassword && !formValues.password) {
      return this.setState({
        errors: {
          ...errors,
          password: new Error("Password required")
        }
      })
    }

    this.setState({
      errors: {}
    })

    event.preventDefault()
    onConfirm(formValues)
  }

  render() {
    const { account, disabled, signatureRequest, transaction, onCancel = () => undefined } = this.props
    const passwordError = this.props.passwordError || this.state.errors.password

    return (
      <form onSubmit={this.onSubmit}>
        <VerticalLayout>
          <TransactionSummary
            showSource={account.publicKey !== transaction.source}
            signatureRequest={signatureRequest}
            testnet={account.testnet}
            transaction={transaction}
          />
          {account.requiresPassword && !disabled ? (
            <TextField
              error={Boolean(passwordError)}
              label={passwordError ? renderFormFieldError(passwordError) : "Password"}
              type="password"
              autoFocus
              fullWidth
              margin="dense"
              value={this.state.formValues.password || ""}
              onChange={event => this.setFormValue("password", event.target.value)}
              style={{ marginBottom: 32 }}
            />
          ) : null}
          <DialogActionsBox style={{ justifyContent: "center" }}>
            <ActionButton onClick={onCancel}>Cancel</ActionButton>
            {disabled ? null : (
              <ActionButton icon={<CheckIcon />} onClick={() => undefined} type="submit">
                Confirm
              </ActionButton>
            )}
          </DialogActionsBox>
        </VerticalLayout>
      </form>
    )
  }
}

export default TxConfirmationForm
