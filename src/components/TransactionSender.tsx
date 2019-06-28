import React from "react"
import { Server, Transaction } from "stellar-sdk"
import Zoom from "@material-ui/core/Zoom"
import { Account } from "../context/accounts"
import { SettingsContext, SettingsContextType } from "../context/settings"
import { useHorizon } from "../hooks"
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
import TransactionReviewDialog from "./TransactionReview/TransactionReviewDialog"
import { isStellarGuardProtected, submitTransactionToStellarGuard } from "../lib/stellar-guard"
import SubmissionProgress, { SubmissionType } from "./SubmissionProgress"

// Had issues with react-storybook vs electron build
type Timer = any

function ConditionalSubmissionProgress(props: {
  onClose: () => void
  promise: Promise<any> | null
  type: SubmissionType
}) {
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
        <div style={innerStyle}>
          {props.promise ? (
            <SubmissionProgress onClose={props.onClose} promise={props.promise} type={props.type} />
          ) : null}
        </div>
      </Zoom>
    </div>
  )
}

interface RenderFunctionProps {
  horizon: Server
  sendTransaction: (
    account: Account,
    transaction: Transaction,
    signatureRequest?: SignatureRequest | null
  ) => Promise<any>
}

interface Props {
  horizon: Server
  settings: SettingsContextType
  children: (props: RenderFunctionProps) => React.ReactNode
  onSubmissionCompleted?: (transaction: Transaction) => void
  onSubmissionFailure?: (error: Error, transaction: Transaction) => void
}

interface State {
  account: Account | null
  confirmationDialogOpen: boolean
  passwordError: Error | null
  signatureRequest: SignatureRequest | null
  submissionStatus: "before" | "pending" | "fulfilled" | "rejected"
  submissionType: SubmissionType
  submissionPromise: Promise<any> | null
  submissionSuccessCallbacks: Array<() => void>
  transaction: Transaction | null
}

class TransactionSender extends React.Component<Props, State> {
  state: State = {
    account: null,
    confirmationDialogOpen: false,
    passwordError: name,
    signatureRequest: null,
    submissionStatus: "before",
    submissionType: SubmissionType.default,
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

  setTransaction = (account: Account, transaction: Transaction, signatureRequest: SignatureRequest | null = null) => {
    this.setState({
      account,
      confirmationDialogOpen: true,
      signatureRequest,
      transaction
    })
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
    if (!this.state.submissionPromise || this.state.submissionStatus !== "pending") {
      // Prevent manually closing the submission progress if tx submission is pending
      this.clearSubmissionPromise()
    }
  }

  clearSubmissionPromise = () => {
    this.setState({
      confirmationDialogOpen: false,
      submissionPromise: null
    })
  }

  setSubmissionPromise = (submissionPromise: Promise<any>) => {
    this.setState({ submissionPromise, submissionStatus: "pending" })

    submissionPromise.then(() => {
      this.setState({ submissionStatus: "fulfilled" })
      this.triggerSubmissionSuccessCallbacks()
      // Auto-close tx confirmation dialog shortly after submission successfully done
      this.submissionTimeouts.push(
        setTimeout(() => {
          this.setState({ confirmationDialogOpen: false })
        }, 1200)
      )
    })
    submissionPromise.catch(() => {
      this.setState({ submissionStatus: "rejected" })
    })
  }

  submitTransaction = async (transaction: Transaction, formValues: { password: string | null }) => {
    let signedTx: Transaction
    const { horizon, onSubmissionCompleted = () => undefined, onSubmissionFailure } = this.props
    const { account } = this.state

    if (!account) {
      throw Error("Invariant violation: account and horizon must not be null")
    }

    try {
      signedTx = await signTransaction(transaction, account, formValues.password)
      this.setState({ passwordError: null })
    } catch (error) {
      if (isWrongPasswordError(error)) {
        this.setState({ passwordError: error })
      }
      throw error
    }

    try {
      if (await isStellarGuardProtected(horizon, account.publicKey)) {
        await this.submitTransactionToStellarGuard(account, signedTx)
      } else if (await requiresRemoteSignatures(horizon, signedTx, account.publicKey)) {
        await this.submitTransactionToMultisigService(account, signedTx)
      } else {
        await this.submitTransactionToHorizon(signedTx)
      }
      setTimeout(() => {
        this.clearSubmissionPromise()
      }, 1000)
      onSubmissionCompleted(signedTx)
    } catch (error) {
      if (onSubmissionFailure) {
        onSubmissionFailure(error, transaction)
      }
    }
  }

  submitTransactionToHorizon = async (signedTransaction: Transaction) => {
    try {
      const promise = this.props.horizon.submitTransaction(signedTransaction)

      this.setSubmissionPromise(promise)
      this.setState({ submissionType: SubmissionType.default })
      return await promise
    } catch (error) {
      // re-throw refined error
      throw explainSubmissionError(error)
    }
  }

  submitTransactionToMultisigService = async (account: Account, signedTransaction: Transaction) => {
    const creationOptions = {
      network_passphrase: account.testnet ? networkPassphrases.testnet : networkPassphrases.mainnet
    }

    const signatureRequestURI = this.state.signatureRequest
      ? this.state.signatureRequest.request_uri
      : createSignatureRequestURI(signedTransaction, creationOptions)

    try {
      const promise = this.state.signatureRequest
        ? collateSignature(this.state.signatureRequest, signedTransaction)
        : submitNewSignatureRequest(this.props.settings.multiSignatureServiceURL, signatureRequestURI)

      this.setSubmissionPromise(promise)
      this.setState({ submissionType: SubmissionType.multisig })
      return await promise
    } catch (error) {
      // re-throw refined error
      throw explainSubmissionError(error)
    }
  }

  submitTransactionToStellarGuard = async (account: Account, signedTransaction: Transaction) => {
    try {
      const promise = submitTransactionToStellarGuard(signedTransaction, account.testnet)

      this.setSubmissionPromise(promise)
      this.setState({ submissionType: SubmissionType.stellarguard })
      return await promise
    } catch (error) {
      throw explainSubmissionError(error)
    }
  }

  render() {
    const {
      account,
      confirmationDialogOpen,
      passwordError,
      signatureRequest,
      submissionPromise,
      transaction
    } = this.state

    const content = this.props.children({
      horizon: this.props.horizon,
      sendTransaction: this.setTransaction
    })

    return (
      <>
        {content}
        {account ? (
          <TransactionReviewDialog
            open={confirmationDialogOpen}
            account={account}
            disabled={!transaction || hasSigned(transaction, account.publicKey)}
            passwordError={passwordError}
            showSource={transaction ? account.publicKey !== transaction.source : undefined}
            signatureRequest={signatureRequest || undefined}
            transaction={transaction}
            onClose={this.onConfirmationDrawerCloseRequest}
            onSubmitTransaction={this.submitTransaction}
            submissionProgress={
              <ConditionalSubmissionProgress
                onClose={this.onConfirmationDrawerCloseRequest}
                promise={submissionPromise}
                type={this.state.submissionType}
              />
            }
          />
        ) : (
          undefined
        )}
      </>
    )
  }
}

interface WithHorizonProps extends Props {
  testnet: boolean
}

function TransactionSenderWithHorizon(props: Omit<Props & WithHorizonProps, "horizon" | "settings">) {
  const horizon = useHorizon(props.testnet)

  const settings = React.useContext(SettingsContext)
  return <TransactionSender {...props} horizon={horizon} settings={settings} />
}

export default TransactionSenderWithHorizon
