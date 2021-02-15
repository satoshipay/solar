import { TFunction } from "i18next"
import React from "react"
import { Translation } from "react-i18next"
import { Networks, Server, Transaction } from "stellar-sdk"
import Zoom from "@material-ui/core/Zoom"
import { Account } from "~App/contexts/accounts"
import { SettingsContext, SettingsContextType } from "~App/contexts/settings"
import { useHorizon } from "~Generic/hooks/stellar"
import { useIsMobile } from "~Generic/hooks/userinterface"
import { isWrongPasswordError, getErrorTranslation } from "~Generic/lib/errors"
import { explainSubmissionErrorResponse } from "~Generic/lib/horizonErrors"
import {
  collateSignature,
  createSignatureRequestURI,
  submitNewSignatureRequest,
  SignatureRequest
} from "~Generic/lib/multisig-service"
import { networkPassphrases } from "~Generic/lib/stellar"
import { hasSigned, requiresRemoteSignatures, signTransaction } from "~Generic/lib/transaction"
import {
  isThirdPartyProtected,
  submitTransactionToThirdPartyService,
  ThirdPartySecurityService
} from "~Generic/lib/third-party-security"
import { workers } from "~Workers/worker-controller"
import TransactionReviewDialog from "~TransactionReview/components/TransactionReviewDialog"
import SubmissionProgress, { SubmissionType } from "./SubmissionProgress"

type Omit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>

// Had issues with react-storybook vs electron build
type Timer = any

function ConditionalSubmissionProgress(props: {
  onClose: () => void
  onRetry: () => void
  promise: Promise<any> | null
  type: SubmissionType
}) {
  const isSmallScreen = useIsMobile()

  const outerStyle: React.CSSProperties = {
    position: "relative",
    display: props.promise ? "flex" : "none",
    width: "100%",
    height: "100%",
    alignItems: "center",
    background: "#fcfcfc",
    flexGrow: 1,
    justifyContent: "center",
    marginBottom: isSmallScreen ? undefined : 24,
    marginTop: isSmallScreen ? undefined : 24
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
            <SubmissionProgress
              onClose={props.onClose}
              onRetry={props.onRetry}
              promise={props.promise}
              type={props.type}
            />
          ) : null}
        </div>
      </Zoom>
    </div>
  )
}

export type SendTransaction = (transaction: Transaction, signatureRequest?: SignatureRequest | null) => Promise<any>

interface RenderFunctionProps {
  horizon: Server
  sendTransaction: SendTransaction
}

interface Props {
  account: Account
  completionCallbackDelay?: number
  forceClose?: boolean
  horizon: Server
  settings: SettingsContextType
  t: TFunction
  children: (props: RenderFunctionProps) => React.ReactNode
  onCloseTransactionDialog?: () => void
  onSubmissionCompleted?: (transaction: Transaction) => void
  onSubmissionFailure?: (error: Error, transaction: Transaction) => void
}

interface State {
  confirmationDialogOpen: boolean
  passwordError: Error | null
  signatureRequest: SignatureRequest | null
  submissionStatus: "before" | "pending" | "fulfilled" | "rejected"
  submissionType: SubmissionType
  submissionPromise: Promise<any> | null
  submissionSuccessCallbacks: Array<() => void>
  transaction: Transaction | null
  signedTransaction: Transaction | null
}

class TransactionSender extends React.Component<Props, State> {
  state: State = {
    confirmationDialogOpen: false,
    passwordError: null,
    signatureRequest: null,
    submissionStatus: "before",
    submissionType: SubmissionType.default,
    submissionPromise: null,
    submissionSuccessCallbacks: [],
    transaction: null,
    signedTransaction: null
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
        submissionSuccessCallbacks: [...state.submissionSuccessCallbacks, resolve as () => void]
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
    if (this.props.onCloseTransactionDialog) {
      this.props.onCloseTransactionDialog()
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

    try {
      signedTx = await signTransaction(transaction, this.props.account, formValues.password)
      this.setState({ passwordError: null, signedTransaction: signedTx })
      this.submitSignedTransaction(signedTx)
    } catch (error) {
      if (isWrongPasswordError(error)) {
        this.setState({ passwordError: error })
        return
      } else {
        throw error
      }
    }
  }

  submitSignedTransaction = async (signedTx: Transaction) => {
    const {
      account,
      completionCallbackDelay = 1000,
      horizon,
      onSubmissionCompleted = () => undefined,
      onSubmissionFailure
    } = this.props
    try {
      const thirdPartySecurityService = await isThirdPartyProtected(horizon, account.publicKey)
      if (thirdPartySecurityService) {
        await this.submitTransactionToThirdPartyService(signedTx, thirdPartySecurityService)
      } else if (await requiresRemoteSignatures(horizon, signedTx, account.publicKey)) {
        await this.submitTransactionToMultisigService(signedTx)
      } else {
        await this.submitTransactionToHorizon(signedTx)
      }
      setTimeout(() => {
        this.clearSubmissionPromise()
      }, 1000)

      setTimeout(() => {
        this.setState({ signedTransaction: null })
        onSubmissionCompleted(signedTx)
      }, completionCallbackDelay)
    } catch (error) {
      if (onSubmissionFailure) {
        onSubmissionFailure(error, signedTx)
      }
    }
  }

  submitTransactionToHorizon = async (signedTransaction: Transaction) => {
    const { netWorker } = await workers

    const network = this.props.account.testnet ? Networks.TESTNET : Networks.PUBLIC
    const txEnvelopeXdr = signedTransaction
      .toEnvelope()
      .toXDR()
      .toString("base64")

    const promise = netWorker
      .submitTransaction(String(this.props.horizon.serverURL), txEnvelopeXdr, network)
      .then(response => {
        if (response.status !== 200) {
          throw explainSubmissionErrorResponse(response, this.props.t)
        }
        return response
      })

    this.setSubmissionPromise(promise)
    this.setState({ submissionType: SubmissionType.default })

    return promise
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
        : submitNewSignatureRequest(this.props.settings.multiSignatureServiceURL, signatureRequestURI)

      this.setSubmissionPromise(promise)
      this.setState({ submissionType: SubmissionType.multisig })
      return await promise
    } catch (error) {
      // re-throw refined error
      throw explainSubmissionErrorResponse(error, this.props.t)
    }
  }

  submitTransactionToThirdPartyService = async (signedTransaction: Transaction, service: ThirdPartySecurityService) => {
    try {
      const promise = submitTransactionToThirdPartyService(signedTransaction, service, this.props.account.testnet)

      this.setSubmissionPromise(promise)
      this.setState({ submissionType: SubmissionType.thirdParty })
      return await promise
    } catch (error) {
      throw explainSubmissionErrorResponse(error, this.props.t)
    }
  }

  retrySubmission = () => {
    if (this.state.signedTransaction) {
      this.submitSignedTransaction(this.state.signedTransaction)
    }
  }

  render() {
    const { confirmationDialogOpen, passwordError, signatureRequest, submissionPromise, transaction } = this.state

    const content = this.props.children({
      horizon: this.props.horizon,
      sendTransaction: this.setTransaction
    })

    return (
      <>
        {content}
        <TransactionReviewDialog
          open={confirmationDialogOpen && !this.props.forceClose}
          account={this.props.account}
          disabled={!transaction || hasSigned(transaction, this.props.account.publicKey)}
          passwordError={passwordError ? new Error(getErrorTranslation(passwordError, this.props.t)) : undefined}
          showHash={false}
          showSource={transaction ? this.props.account.publicKey !== transaction.source : undefined}
          showSubmissionProgress={Boolean(submissionPromise)}
          signatureRequest={signatureRequest || undefined}
          transaction={transaction}
          onClose={this.onConfirmationDrawerCloseRequest}
          onSubmitTransaction={this.submitTransaction}
          submissionProgress={
            <ConditionalSubmissionProgress
              onClose={this.onConfirmationDrawerCloseRequest}
              onRetry={this.retrySubmission}
              promise={submissionPromise}
              type={this.state.submissionType}
            />
          }
        />
      </>
    )
  }
}

function TransactionSenderWithHorizon(props: Omit<Props, "horizon" | "settings" | "t">) {
  const horizon = useHorizon(props.account.testnet)
  const settings = React.useContext(SettingsContext)
  return <Translation>{t => <TransactionSender {...props} horizon={horizon} settings={settings} t={t} />}</Translation>
}

export default React.memo(TransactionSenderWithHorizon)
