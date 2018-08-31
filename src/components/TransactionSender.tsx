import React from "react"
import { Server, Transaction } from "stellar-sdk"
import Dialog from "@material-ui/core/Dialog"
import DialogContent from "@material-ui/core/DialogContent"
import { isWrongPasswordError } from "../lib/errors"
import { signTransaction } from "../lib/transaction"
import { Account } from "../stores/accounts"
import { addError } from "../stores/notifications"
import TxConfirmationDrawer from "./Dialog/TransactionConfirmation"
import SubmissionProgress from "./SubmissionProgress"
import { Horizon } from "./Subscribers"

type Omit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>

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

interface RenderFunctionProps {
  horizon: Server
  sendTransaction: (transaction: Transaction) => void
}

interface Props {
  account: Account
  horizon: Server
  children: (props: RenderFunctionProps) => React.ReactNode
  onSubmissionCompleted?: (transaction: Transaction) => void
  onSubmissionFailure?: (error: Error, transaction: Transaction) => void
}

interface State {
  submissionFailed: boolean
  submissionPromise: Promise<any> | null
  transaction: Transaction | null
}

class TransactionSender extends React.Component<Props, State> {
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

  submitTransaction = async (transaction: Transaction, formValues: { password: string | null }) => {
    const { onSubmissionCompleted = () => undefined, onSubmissionFailure } = this.props

    try {
      const signedTx = await signTransaction(transaction, this.props.account, formValues.password)
      const promise = this.props.horizon.submitTransaction(signedTx)

      this.setSubmissionPromise(promise)
      await promise

      onSubmissionCompleted(signedTx)
    } catch (error) {
      if (isWrongPasswordError(error)) {
        return this.setSubmissionPromise(Promise.reject(error))
      } else if (onSubmissionFailure) {
        onSubmissionFailure(error, transaction)
      } else {
        addError(error)
      }
    }
  }

  render() {
    const { submissionFailed, submissionPromise, transaction } = this.state

    const content = this.props.children({
      horizon: this.props.horizon,
      sendTransaction: this.setTransaction
    })

    return (
      <>
        {content}
        <TxConfirmationDrawer
          open={Boolean(transaction)}
          account={this.props.account}
          transaction={transaction}
          onClose={this.clearTransaction}
          onSubmitTransaction={this.submitTransaction}
        />
        {submissionPromise ? (
          <SubmissionProgressOverlay
            open
            onClose={this.clearSubmissionPromise}
            submissionFailed={submissionFailed}
            submissionPromise={submissionPromise}
          />
        ) : null}
      </>
    )
  }
}

const TransactionSenderWithHorizon = (props: Omit<Props, "horizon">) => (
  <Horizon testnet={props.account.testnet}>{horizon => <TransactionSender {...props} horizon={horizon} />}</Horizon>
)

export default TransactionSenderWithHorizon
