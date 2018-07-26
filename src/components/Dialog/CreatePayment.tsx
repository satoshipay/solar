import React from "react"
import Dialog from "@material-ui/core/Dialog"
import DialogContent from "@material-ui/core/DialogContent"
import { Transaction } from "stellar-sdk"
import {
  createWrongPasswordError,
  isWrongPasswordError
} from "../../lib/errors"
import { createTransaction, signTransaction } from "../../lib/transaction"
import { Account } from "../../stores/accounts"
import { withHorizon, HorizonProps } from "../../hocs"
import { PaymentCreationValues } from "../Form/CreatePayment"
import SubmissionProgress from "../SubmissionProgress"
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

interface CreatePaymentDrawerProps {
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
  onSubmitTransaction: (
    tx: Transaction,
    formValues: { password: string | null }
  ) => void
}

const CreatePaymentDrawer = (props: CreatePaymentDrawerProps) => {
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

interface StatefulCreatePaymentDrawerProps {
  account: Account
  open: boolean
  onClose: () => void
}

interface State {
  submissionFailed: boolean
  submissionPromise: Promise<any> | null
  transaction: Transaction | null
}

class StatefulCreatePaymentDrawer extends React.Component<
  StatefulCreatePaymentDrawerProps & HorizonProps,
  State
> {
  state = {
    submissionFailed: false,
    submissionPromise: null,
    transaction: null
  }

  getHorizon = () => {
    return this.props.account.testnet
      ? this.props.horizonTestnet
      : this.props.horizonLivenet
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
      console.error(error)

      if (isWrongPasswordError(error)) {
        this.setSubmissionPromise(Promise.reject(error))
      } else {
        // TODO: Error handling
      }
    }
  }

  createTransaction = (formValues: PaymentCreationValues) => {
    this.runErrorHandled(async () => {
      const tx = await createTransaction({
        ...formValues,
        horizon: this.getHorizon(),
        walletAccount: this.props.account,
        testnet: this.props.account.testnet
      })
      this.setTransaction(tx)
    })
  }

  submitTransaction = (
    transaction: Transaction,
    formValues: { password: string | null }
  ) => {
    const { account } = this.props

    this.runErrorHandled(async () => {
      if (account.requiresPassword && !formValues.password) {
        throw createWrongPasswordError(
          `Account is password-protected, but no password has been provided.`
        )
      }

      const privateKey = await account.getPrivateKey(formValues.password)
      const signedTx = signTransaction(transaction, privateKey)

      const horizon = this.getHorizon()
      const promise = horizon.submitTransaction(signedTx)
      this.setSubmissionPromise(promise)

      await promise

      // Close automatically a second after successful submission
      setTimeout(() => this.props.onClose(), 1000)
    })
  }

  render() {
    return (
      <CreatePaymentDrawer
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

export default withHorizon(StatefulCreatePaymentDrawer)
