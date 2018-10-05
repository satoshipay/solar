import React from "react"
import Button from "@material-ui/core/Button"
import TextField from "@material-ui/core/TextField"
import SendIcon from "react-icons/lib/md/send"
import { Transaction } from "stellar-sdk"
import { Account } from "../../stores/accounts"
import { HorizontalLayout, VerticalLayout } from "../Layout/Box"
import TransactionSummary from "../TransactionSummary"

interface Props {
  account: Account
  transaction: Transaction
  onConfirm?: (formValues: State) => any
  onCancel?: () => any
}

interface State {
  password: string | null
}

class TxConfirmationForm extends React.Component<Props, State> {
  state: State = {
    password: null
  }

  setFormValue = <Key extends keyof State>(key: keyof State, value: State[Key]) => {
    this.setState({
      [key]: value
    })
  }

  onSubmit = (event: React.SyntheticEvent) => {
    const { onConfirm = () => {} } = this.props

    event.preventDefault()
    onConfirm(this.state)
  }

  render() {
    const { account, transaction, onCancel = () => undefined } = this.props

    return (
      <form onSubmit={this.onSubmit}>
        <VerticalLayout>
          <TransactionSummary transaction={transaction} />
          {account.requiresPassword ? (
            <TextField
              label="Password"
              type="password"
              autoFocus
              fullWidth
              margin="dense"
              value={this.state.password || ""}
              onChange={event => this.setFormValue("password", event.target.value)}
              style={{ marginBottom: 32 }}
            />
          ) : null}
          <HorizontalLayout justifyContent="center" margin="24px 0 0" wrap="wrap">
            <Button variant="contained" color="primary" onClick={this.onSubmit} style={{ marginRight: 32 }}>
              <SendIcon style={{ marginRight: 8 }} />
              Send
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
