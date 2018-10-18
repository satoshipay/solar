import React from "react"
import Button from "@material-ui/core/Button"
import TextField from "@material-ui/core/TextField"
import CheckIcon from "@material-ui/icons/Check"
import { Transaction } from "stellar-sdk"
import { renderFormFieldError } from "../../lib/errors"
import { Account } from "../../stores/accounts"
import { HorizontalLayout, VerticalLayout } from "../Layout/Box"
import ButtonIconLabel from "../ButtonIconLabel"
import TransactionSummary from "../TransactionSummary"

interface FormValues {
  password: string | null
}

interface Props {
  account: Account
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
    const { account, transaction, onCancel = () => undefined } = this.props

    return (
      <form onSubmit={this.onSubmit}>
        <VerticalLayout>
          <TransactionSummary transaction={transaction} />
          {account.requiresPassword ? (
            <TextField
              error={Boolean(this.state.errors.password)}
              label={this.state.errors.password ? renderFormFieldError(this.state.errors.password) : "Password"}
              type="password"
              autoFocus
              fullWidth
              margin="dense"
              value={this.state.formValues.password || ""}
              onChange={event => this.setFormValue("password", event.target.value)}
              style={{ marginBottom: 32 }}
            />
          ) : null}
          <HorizontalLayout justifyContent="center" margin="24px 0 0" wrap="wrap">
            <Button variant="contained" color="primary" onClick={this.onSubmit} style={{ marginRight: 32 }}>
              <ButtonIconLabel label="Confirm">
                <CheckIcon />
              </ButtonIconLabel>
            </Button>
            <Button variant="contained" onClick={onCancel}>
              Cancel
            </Button>
          </HorizontalLayout>
        </VerticalLayout>
      </form>
    )
  }
}

export default TxConfirmationForm
