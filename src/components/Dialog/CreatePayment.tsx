import React from "react"
import Dialog from "@material-ui/core/Dialog"
import DialogContent from "@material-ui/core/DialogContent"
import { Memo, Server, Transaction } from "stellar-sdk"
import { isWrongPasswordError } from "../../lib/errors"
import { createPaymentOperation, createTransaction, signTransaction } from "../../lib/transaction"
import { Account } from "../../stores/accounts"
import { addError } from "../../stores/notifications"
import { PaymentCreationValues } from "../Form/CreatePayment"
import { Horizon } from "../Subscribers"
import TransactionSender from "../TransactionSender"
import PaymentFormDrawer from "./PaymentForm"

type Omit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>

interface Props {
  account: Account
  horizon: Server
  open: boolean
  onClose: () => void
  sendTransaction: (transaction: Transaction) => void
}

interface State {
  submissionFailed: boolean
  submissionPromise: Promise<any> | null
  transaction: Transaction | null
}

class CreatePaymentDialog extends React.Component<Props, State> {
  createMemo = (formValues: PaymentCreationValues) => {
    switch (formValues.memoType) {
      case "id":
        return Memo.id(formValues.memoValue)
      case "text":
        return Memo.text(formValues.memoValue)
      default:
        return Memo.none()
    }
  }

  createTransaction = async (formValues: PaymentCreationValues) => {
    try {
      const payment = await createPaymentOperation({
        amount: formValues.amount,
        destination: formValues.destination,
        horizon: this.props.horizon
      })
      const tx = await createTransaction([payment], {
        memo: this.createMemo(formValues),
        horizon: this.props.horizon,
        walletAccount: this.props.account
      })
      this.props.sendTransaction(tx)
    } catch (error) {
      addError(error)
    }
  }

  render() {
    return (
      <PaymentFormDrawer
        open={this.props.open}
        account={this.props.account}
        onClose={this.props.onClose}
        onSubmit={this.createTransaction}
      />
    )
  }
}

const ConnectedCreatePaymentDialog = (props: Omit<Props, "horizon" | "sendTransaction">) => {
  const closeAfterTimeout = () => {
    // Close automatically a second after successful submission
    setTimeout(() => props.onClose(), 1000)
  }
  return (
    <TransactionSender account={props.account} onSubmissionCompleted={closeAfterTimeout}>
      {({ horizon, sendTransaction }) => (
        <CreatePaymentDialog {...props} horizon={horizon} sendTransaction={sendTransaction} />
      )}
    </TransactionSender>
  )
}

export default ConnectedCreatePaymentDialog
