import React from "react"
import Dialog from "@material-ui/core/Dialog"
import DialogContent from "@material-ui/core/DialogContent"
import { Memo, Server, Transaction } from "stellar-sdk"
import { createWrongPasswordError, isWrongPasswordError } from "../../lib/errors"
import { createPaymentOperation, createTransaction, signTransaction } from "../../lib/transaction"
import { Account } from "../../stores/accounts"
import { addError } from "../../stores/notifications"
import { PaymentCreationValues } from "../Form/CreatePayment"
import SubmissionProgress from "../SubmissionProgress"
import { Horizon } from "../Subscribers"
import PaymentFormDrawer from "./PaymentForm"
import TxConfirmationDrawer from "./TransactionConfirmation"

const SubmissionProgressOverlay = (props: {
  open: boolean
  onClose: () => void
  submissionFailed: boolean
  submissionPromise: Promise<any>
}) => {
  const onClose = () => {
    // Only allow the user to close the overlay if the submission failed
    if (props.submissionFailed) {
      props.onClose()
    }
  }
  return (
    <Dialog open={props.open} onClose={onClose} PaperProps={{ elevation: 20 }}>
      <DialogContent>
        <SubmissionProgress promise={props.submissionPromise} />
      </DialogContent>
    </Dialog>
  )
}

interface StatelessCreatePaymentDrawerProps {
  account: Account
  open: boolean
  transaction: Transaction | null
  clearTransaction: () => any
  setTransaction: (tx: Transaction) => void
  submissionFailed: boolean
  submissionPromise: Promise<any> | null
  clearSubmissionPromise: () => void
  setSubmissionPromise: (promise: Promise<any>) => void
  onClose: () => void
  onPaymentFormSubmission: (formValues: PaymentCreationValues) => void
  onSubmitTransaction: (tx: Transaction, formValues: { password: string | null }) => void
}

const StatelessCreatePaymentDrawer = (props: StatelessCreatePaymentDrawerProps) => {
  return (
    <>
      <PaymentFormDrawer
        open={props.open}
        account={props.account}
        onClose={props.onClose}
        onSubmit={props.onPaymentFormSubmission}
      />
      <TxConfirmationDrawer
        open={Boolean(props.open && props.transaction)}
        account={props.account}
        transaction={props.transaction}
        onClose={props.clearTransaction}
        onSubmitTransaction={props.onSubmitTransaction}
      />
      {props.submissionPromise ? (
        <SubmissionProgressOverlay
          open
          onClose={props.clearSubmissionPromise}
          submissionFailed={props.submissionFailed}
          submissionPromise={props.submissionPromise}
        />
      ) : null}
    </>
  )
}

interface CreatePaymentDrawerProps {
  account: Account
  open: boolean
  onClose: () => void
}

interface State {
  submissionFailed: boolean
  submissionPromise: Promise<any> | null
  transaction: Transaction | null
}

class StatefulCreatePaymentDrawer extends React.Component<CreatePaymentDrawerProps & { horizon: Server }, State> {
  state = {
    submissionFailed: false,
    submissionPromise: null,
    transaction: null
  }

  clearTransaction = () => {
    this.setState({ transaction: null })
  }

  setTransaction = (transaction: Transaction) => {
    this.setState({ transaction })
  }

  clearSubmissionPromise = () => {
    this.setState({ submissionPromise: null })
  }

  setSubmissionPromise = (submissionPromise: Promise<any>) => {
    this.setState({ submissionPromise, submissionFailed: false })

    submissionPromise.catch(() => {
      this.setState({ submissionFailed: true })
    })
  }

  runErrorHandled = async <Result extends any>(fn: () => Result) => {
    try {
      await fn()
    } catch (error) {
      addError(error)
    }
  }

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

  createTransaction = (formValues: PaymentCreationValues) => {
    this.runErrorHandled(async () => {
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
      this.setTransaction(tx)
    })
  }

  submitTransaction = (transaction: Transaction, formValues: { password: string | null }) => {
    const signAndSubmit = async (account: Account) => {
      if (account.requiresPassword && !formValues.password) {
        throw createWrongPasswordError(`Account is password-protected, but no password has been provided.`)
      }

      const privateKey = await account.getPrivateKey(formValues.password)
      const signedTx = signTransaction(transaction, privateKey)

      const promise = this.props.horizon.submitTransaction(signedTx)

      this.setSubmissionPromise(promise)
      await promise
    }

    this.runErrorHandled(async () => {
      try {
        await signAndSubmit(this.props.account)
      } catch (error) {
        if (isWrongPasswordError(error)) {
          return this.setSubmissionPromise(Promise.reject(error))
        } else {
          throw error
        }
      }

      // Close automatically a second after successful submission
      setTimeout(() => this.props.onClose(), 1000)
    })
  }

  render() {
    return (
      <StatelessCreatePaymentDrawer
        account={this.props.account}
        open={this.props.open}
        onClose={this.props.onClose}
        clearSubmissionPromise={this.clearSubmissionPromise}
        setSubmissionPromise={this.setSubmissionPromise}
        submissionPromise={this.state.submissionPromise}
        submissionFailed={this.state.submissionFailed}
        clearTransaction={this.clearTransaction}
        setTransaction={this.setTransaction}
        transaction={this.state.transaction}
        onPaymentFormSubmission={this.createTransaction}
        onSubmitTransaction={this.submitTransaction}
      />
    )
  }
}

const CreatePaymentDrawer = (props: CreatePaymentDrawerProps) => (
  <Horizon testnet={props.account.testnet}>
    {horizon => <StatefulCreatePaymentDrawer {...props} horizon={horizon} />}
  </Horizon>
)

export default CreatePaymentDrawer
