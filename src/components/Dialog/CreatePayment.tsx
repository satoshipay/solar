import React from "react"
import Dialog from "@material-ui/core/Dialog"
import DialogContent from "@material-ui/core/DialogContent"
import { Transaction } from "stellar-sdk"
import { createTransaction, signTransaction } from "../../lib/transaction"
import { Account } from "../../stores/accounts"
import { withHorizon, HorizonProps } from "../../hocs"
import { PaymentCreationValues } from "../Form/CreatePayment"
import SubmissionProgress from "../SubmissionProgress"
import PaymentFormDrawer from "./PaymentForm"
import TxConfirmationDrawer from "./TransactionConfirmation"

const SubmissionProgressOverlay = (props: {
  open: boolean
  submissionPromise: Promise<any>
}) => {
  return (
    <Dialog open={props.open} PaperProps={{ elevation: 20 }}>
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
  submissionPromise: Promise<any> | null
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
  submissionPromise: Promise<any> | null
  transaction: Transaction | null
}

class StatefulCreatePaymentDrawer extends React.Component<
  StatefulCreatePaymentDrawerProps & HorizonProps,
  State
> {
  state = {
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

  setSubmissionPromise = (submissionPromise: Promise<any>) => {
    this.setState({ submissionPromise })
  }

  runErrorHandled = async <Result extends any>(fn: () => Result) => {
    try {
      await fn()
    } catch (error) {
      // TODO: Error handling
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
        throw new Error(
          `Account is password-protected, but no password has been provided.`
        )
      }

      const signedTx = await signTransaction(
        transaction,
        account,
        formValues.password
      )

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
        setSubmissionPromise={this.setSubmissionPromise}
        submissionPromise={this.state.submissionPromise}
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
