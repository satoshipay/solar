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
import { resolveMultiSignatureCoordinator } from "~Generic/lib/multisig-discovery"
import { MultisigTransactionResponse } from "~Generic/lib/multisig-service"
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
  onRetry: () => Promise<void>
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

export type SendTransaction = (
  transaction: Transaction,
  signatureRequest?: MultisigTransactionResponse | null
) => Promise<any>

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
  signatureRequest: MultisigTransactionResponse | null
  submissionStatus: "before" | "pending" | "fulfilled" | "rejected"
  submissionType: SubmissionType
  submissionPromise: Promise<any> | null
  submissionSuccessCallbacks: Array<() => void>
  submissionClosedCallbacks: Array<() => void>
  signedTransaction: Transaction | null
  unsignedTransaction: Transaction | null
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
    submissionClosedCallbacks: [],
    signedTransaction: null,
    unsignedTransaction: null
  }

  submissionTimeouts: Timer[] = []

  componentWillUnmount() {
    for (const timeout of this.submissionTimeouts) {
      clearTimeout(timeout)
    }
  }

  setTransaction = (transaction: Transaction, signatureRequest: MultisigTransactionResponse | null = null) => {
    this.setState({ confirmationDialogOpen: true, signatureRequest, unsignedTransaction: transaction })
    return new Promise((resolve, reject) => {
      this.setState(state => ({
        submissionSuccessCallbacks: [...state.submissionSuccessCallbacks, resolve as () => void],
        submissionClosedCallbacks: [...state.submissionClosedCallbacks, reject as () => void]
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

  triggerSubmissionClosedCallbacks = () => {
    const callbacks = this.state.submissionClosedCallbacks
    this.setState({ submissionClosedCallbacks: [] })

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
    this.triggerSubmissionClosedCallbacks()
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
    const unsignedTx = transaction
    let signedTx: Transaction

    try {
      signedTx = await signTransaction(transaction, this.props.account, formValues.password)
      this.setState({ passwordError: null, signedTransaction: signedTx, unsignedTransaction: unsignedTx })
      this.submitSignedTransaction(signedTx, unsignedTx)
    } catch (error) {
      if (isWrongPasswordError(error)) {
        this.setState({ passwordError: error })
        return
      } else {
        throw error
      }
    }
  }

  submitSignedTransaction = async (signedTx: Transaction, unsignedTx: Transaction) => {
    const {
      account,
      completionCallbackDelay = 1000,
      horizon,
      onSubmissionCompleted = () => undefined,
      onSubmissionFailure
    } = this.props
    try {
      const thirdPartySecurityService = await isThirdPartyProtected(horizon, account.accountID)
      if (thirdPartySecurityService) {
        await this.submitTransactionToThirdPartyService(signedTx, thirdPartySecurityService)
      } else if (
        this.state.signatureRequest &&
        (this.state.signatureRequest.status === "ready" || this.state.signatureRequest.status === "failed")
      ) {
        await this.submitMultisigTransactionToStellarNetwork(this.state.signatureRequest)
      } else if (
        // handle edge case where a signature request was created from a source account
        // with master weight set to 0 --> request should be submitted to multisig service
        // although it does not require remote signatures
        this.state.signatureRequest?.status === "pending" ||
        (await requiresRemoteSignatures(horizon, signedTx, account.publicKey))
      ) {
        await this.submitTransactionToMultisigService(signedTx, unsignedTx)
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

  submitMultisigTransactionToStellarNetwork = async (signatureRequest: MultisigTransactionResponse) => {
    const { netWorker } = await workers
    const promise = netWorker.submitMultisigTransactionToStellarNetwork(signatureRequest).then(response => {
      if (response.status !== 200) {
        throw explainSubmissionErrorResponse(response, this.props.t)
      }
      return response
    })

    this.setSubmissionPromise(promise)
    this.setState({ submissionType: SubmissionType.default })

    return promise
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

  submitTransactionToMultisigService = async (signedTransaction: Transaction, unsignedTransaction: Transaction) => {
    const { netWorker } = await workers

    try {
      let promise: ReturnType<typeof netWorker.submitSignature>
      const multiSignatureServiceURL = await resolveMultiSignatureCoordinator(
        this.props.settings.multiSignatureCoordinator
      )

      if (this.state.signatureRequest) {
        promise = netWorker.submitSignature(this.state.signatureRequest, signedTransaction.toEnvelope().toXDR("base64"))
      } else {
        if (signedTransaction.signatures.length !== 1) {
          throw Error(
            `Internal error: Expected exactly one signature on new multi-sig transaction. Got ${signedTransaction.signatures.length}.`
          )
        }
        const signatureXDR = signedTransaction.signatures[0].signature().toString("base64")
        promise = netWorker.shareTransaction(
          multiSignatureServiceURL,
          this.props.account.publicKey,
          this.props.account.testnet,
          unsignedTransaction.toEnvelope().toXDR("base64"),
          signatureXDR
        )
      }

      this.setSubmissionPromise(promise)
      this.setState({ submissionType: SubmissionType.multisig })

      const result = await promise

      if (result.submittedToStellarNetwork) {
        this.setState({ submissionType: SubmissionType.default })
      }

      return result
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

  retrySubmission = async () => {
    if (this.state.signedTransaction && this.state.unsignedTransaction) {
      return this.submitSignedTransaction(this.state.signedTransaction, this.state.unsignedTransaction)
    }
  }

  render() {
    const {
      confirmationDialogOpen,
      passwordError,
      signatureRequest,
      submissionPromise,
      unsignedTransaction: transaction
    } = this.state

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
          disabled={
            !transaction ||
            (hasSigned(transaction, this.props.account.publicKey, signatureRequest) &&
              signatureRequest?.status !== "ready" &&
              signatureRequest?.status !== "failed")
          }
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
