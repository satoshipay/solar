import React from "react"
import { Server, Transaction } from "stellar-sdk"
import Zoom from "@material-ui/core/Zoom"
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

// Had issues with react-storybook vs electron build
type Timer = any

const ConditionalSubmissionProgress = (props: { promise: Promise<any> | null }) => {
  const outerStyle: React.CSSProperties = {
    position: "absolute",
    display: props.promise ? "flex" : "none",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    background: "white"
  }
  const innerStyle: React.CSSProperties = {
    display: "flex",
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center"
  }
  return (
    <div style={outerStyle}>
      <Zoom in={Boolean(props.promise)}>
        <div style={innerStyle}>{props.promise ? <SubmissionProgress promise={props.promise} /> : null}</div>
      </Zoom>
    </div>
  )
}

interface RenderFunctionProps {
  horizon: Server
  sendTransaction: (transaction: Transaction, signatureRequest?: SignatureRequest | null) => Promise<any>
}

interface Props {
  account: Account
  horizon: Server
  children: (props: RenderFunctionProps) => React.ReactNode
  onSubmissionCompleted?: (transaction: Transaction) => void
  onSubmissionFailure?: (error: Error, transaction: Transaction) => void
}

interface State {
  confirmationDialogOpen: boolean
  signatureRequest: SignatureRequest | null
  submissionFailed: boolean
  submissionPromise: Promise<any> | null
  submissionSuccessCallbacks: Array<() => void>
  transaction: Transaction | null
}

class TransactionSender extends React.Component<Props, State> {
  state: State = {
    confirmationDialogOpen: false,
    signatureRequest: null,
    submissionFailed: false,
    submissionPromise: null,
    submissionSuccessCallbacks: [],
    transaction: null
  }

  submissionTimeouts: Timer[] = []

  componentWillUnmount() {
    for (const timeout of this.submissionTimeouts) {
      clearTimeout(timeout)
    }
  }

  setTransaction = (transaction: Transaction, signatureRequest: SignatureRequest | null = null) => {
    this.setState({ confirmationDialogOpen: true, signatureRequest, transaction })
    return new Promise(resolve => {
      this.setState(state => ({
        submissionSuccessCallbacks: [...state.submissionSuccessCallbacks, resolve]
      }))
    })
  }

  triggerSubmissionSuccessCallbacks = () => {
    const callbacks = this.state.submissionSuccessCallbacks
    this.setState({ submissionSuccessCallbacks: [] })

    for (const callback of callbacks) {
      callback()
    }
  }

  onConfirmationDrawerCloseRequest = () => {
    if (this.state.submissionPromise) {
      if (this.state.submissionFailed) {
        // Only allow manually closing the submission progress if tx submission failed
        this.clearSubmissionPromise()
      }
    } else {
      this.setState({ confirmationDialogOpen: false })
    }
  }

  clearSubmissionPromise = () => {
    this.setState({ submissionPromise: null })
  }

  setSubmissionPromise = (submissionPromise: Promise<any>) => {
    this.setState({ submissionPromise, submissionFailed: false })

    submissionPromise.then(() => {
      this.triggerSubmissionSuccessCallbacks()
      // Auto-close tx confirmation dialog shortly after submission successfully done
      this.submissionTimeouts.push(
        setTimeout(() => {
          this.setState({ confirmationDialogOpen: false })
        }, 1200)
      )
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
    const { confirmationDialogOpen, submissionPromise, transaction } = this.state

    const content = this.props.children({
      horizon: this.props.horizon,
      sendTransaction: this.setTransaction
    })

    return (
      <>
        {content}
        <TxConfirmationDrawer
          open={confirmationDialogOpen}
          account={this.props.account}
          disabled={!transaction || hasSigned(transaction, this.props.account.publicKey)}
          transaction={transaction}
          onClose={this.onConfirmationDrawerCloseRequest}
          onSubmitTransaction={this.submitTransaction}
          submissionProgress={<ConditionalSubmissionProgress promise={submissionPromise} />}
        />
      </>
    )
  }
}

const TransactionSenderWithHorizon = (props: Omit<Props, "horizon">) => (
  <Horizon testnet={props.account.testnet}>{horizon => <TransactionSender {...props} horizon={horizon} />}</Horizon>
)

export default TransactionSenderWithHorizon
