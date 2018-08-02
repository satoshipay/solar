import React from "react"
import Button from "@material-ui/core/Button"
import TextField from "@material-ui/core/TextField"
import SendIcon from "react-icons/lib/md/send"
import { Transaction } from "stellar-sdk"
import { addFormState, renderError, InnerFormProps } from "../../lib/formHandling"
import { Account } from "../../stores/accounts"
import { HorizontalLayout, VerticalLayout } from "../Layout/Box"
import TransactionSummary from "../TransactionSummary"

interface TxConfirmationValues {
  password: string | null
}

interface TxConfirmationFormProps {
  account: Account
  transaction: Transaction
  onConfirm?: (formValues: TxConfirmationValues) => any
  onCancel?: () => any
}

const TxConfirmationForm = (props: InnerFormProps<TxConfirmationValues> & TxConfirmationFormProps) => {
  const {
    account,
    formValues,
    setFormValue,
    transaction,
    onConfirm = () => undefined,
    onCancel = () => undefined
  } = props

  const onSubmit = (event: React.SyntheticEvent) => {
    event.preventDefault()
    onConfirm(formValues)
  }
  return (
    <form onSubmit={onSubmit}>
      <VerticalLayout>
        <TransactionSummary transaction={transaction} />
        {account.requiresPassword ? (
          <TextField
            label="Password"
            type="password"
            autoFocus
            fullWidth
            margin="dense"
            value={formValues.password || ""}
            onChange={event => setFormValue("password", event.target.value)}
            style={{ marginBottom: 32 }}
          />
        ) : null}
        <HorizontalLayout justifyContent="center" wrap="wrap">
          <Button variant="contained" color="primary" onClick={onSubmit} style={{ marginRight: 32 }}>
            <SendIcon style={{ marginRight: 8 }} />
            Sign and submit
          </Button>
          <Button variant="contained" onClick={onCancel}>
            Cancel
          </Button>
        </HorizontalLayout>
      </VerticalLayout>
    </form>
  )
}

const StatefulTxConfirmationForm = addFormState<TxConfirmationValues, TxConfirmationFormProps>({
  defaultValues: {
    password: null
  }
})(TxConfirmationForm)

export default StatefulTxConfirmationForm
