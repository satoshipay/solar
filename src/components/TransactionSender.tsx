import React from "react"
import { Server, Transaction } from "stellar-sdk"
import Dialog from "@material-ui/core/Dialog"
import DialogContent from "@material-ui/core/DialogContent"
import { Account } from "../context/accounts"
import { addError } from "../context/notifications"
import { getMultisigServiceURL } from "../feature-flags"
import { isWrongPasswordError } from "../lib/errors"
import { explainSubmissionError } from "../lib/horizonErrors"
import {
  collateSignature,
  createSignatureRequestURI,
  submitNewSignatureRequest,
  SignatureRequest
} from "../lib/multisig-service"
import { networkPassphrases } from "../lib/stellar"
import { hasSigned, requiresRemoteSignatures, signTransaction } from "../lib/transaction"
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
  signatureRequest: SignatureRequest | null
  submissionFailed: boolean
  submissionPromise: Promise<any> | null
  transaction: Transaction | null
}

class TransactionSender extends React.Component<Props, State> {
  state: State = {
    signatureRequest: null,
    submissionFailed: false,
    submissionPromise: null,
    transaction: null
  }

  submissionTimeout: NodeJS.Timer | null = null

  componentWillUnmount() {
    if (this.submissionTimeout) {
      clearTimeout(this.submissionTimeout)
    }
  }

  clearTransaction = () => {
    this.setState({ transaction: null })
  }

  setTransaction = (transaction: Transaction, signatureRequest: SignatureRequest | null = null) => {
    this.setState({ signatureRequest, transaction })
  }

  clearSubmissionPromise = () => {
    this.setState({ submissionPromise: null })
  }

  setSubmissionPromise = (submissionPromise: Promise<any>) => {
    this.setState({ submissionPromise, submissionFailed: false })

    submissionPromise.then(() => {
      // Auto-close submission progress overlay shortly after submission successfully done
      this.submissionTimeout = setTimeout(() => {
        this.clearSubmissionPromise()
        this.clearTransaction()
      }, 1200)
    })
    submissionPromise.catch(() => {
      this.setState({ submissionFailed: true })
    })
  }

  submitTransaction = async (transaction: Transaction, formValues: { password: string | null }) => {
    const { account, horizon, onSubmissionCompleted = () => undefined, onSubmissionFailure } = this.props

    try {
      const signedTx = await signTransaction(transaction, this.props.account, formValues.password)

      if (await requiresRemoteSignatures(horizon, signedTx, account.publicKey)) {
        await this.submitTransactionToMultisigService(signedTx)
      } else {
        await this.submitTransactionToHorizon(signedTx)
      }

      onSubmissionCompleted(signedTx)
    } catch (error) {
      if (isWrongPasswordError(error)) {
        return this.setSubmissionPromise(Promise.reject(error))
      }

      if (onSubmissionFailure) {
        onSubmissionFailure(error, transaction)
      } else {
        addError(error)
      }
    }
  }

  submitTransactionToHorizon = async (signedTransaction: Transaction) => {
    try {
      const promise = this.props.horizon.submitTransaction(signedTransaction)

      this.setSubmissionPromise(promise)
      return await promise
    } catch (error) {
      // re-throw refined error
      throw explainSubmissionError(error)
    }
  }

  submitTransactionToMultisigService = async (signedTransaction: Transaction) => {
    const creationOptions = {
      network_passphrase: this.props.account.testnet ? networkPassphrases.testnet : networkPassphrases.mainnet
    }

    const signatureRequestURI = this.state.signatureRequest
      ? this.state.signatureRequest.request_uri
      : createSignatureRequestURI(signedTransaction, creationOptions)

    try {
      const promise = this.state.signatureRequest
        ? collateSignature(this.state.signatureRequest, signedTransaction)
        : submitNewSignatureRequest(getMultisigServiceURL(), signatureRequestURI)

      this.setSubmissionPromise(promise)
      return await promise
    } catch (error) {
      // re-throw refined error
      throw explainSubmissionError(error)
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
          disabled={!transaction || hasSigned(transaction, this.props.account.publicKey)}
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
