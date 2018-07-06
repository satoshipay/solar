import React from "react"
import Button from "@material-ui/core/Button"
import SendIcon from "react-icons/lib/md/send"
import { Transaction } from "stellar-sdk"
import { addFormState, InnerFormProps } from "../../lib/formHandling"
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

const TxConfirmationForm = (
  props: InnerFormProps<TxConfirmationValues> & TxConfirmationFormProps
) => {
  const {
    account,
    formValues,
    transaction,
    onConfirm = () => undefined,
    onCancel = () => undefined
  } = props

  const onSubmit = () => {
    onConfirm(formValues)
  }
  return (
    <form onSubmit={onSubmit}>
      <VerticalLayout>
        <TransactionSummary transaction={transaction} />
        <HorizontalLayout justifyContent="center" wrap="wrap">
          <Button
            variant="contained"
            color="primary"
            onClick={onSubmit}
            style={{ marginRight: 32 }}
          >
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

const StatefulTxConfirmationForm = addFormState<
  TxConfirmationValues,
  TxConfirmationFormProps
>({
  defaultValues: {
    password: null
  }
})(TxConfirmationForm)

export default StatefulTxConfirmationForm
