import BigNumber from "big.js"
import React from "react"
import { useTranslation } from "react-i18next"
import Dialog from "@material-ui/core/Dialog"
import useMediaQuery from "@material-ui/core/useMediaQuery"
import { Operation, Transaction } from "stellar-sdk"
import { Account } from "../../context/accounts"
import { SignatureRequest } from "../../lib/multisig-service"
import { isStellarWebAuthTransaction } from "../../lib/transaction"
import { useDialogActions, useIsMobile } from "../../hooks/userinterface"
import { FullscreenDialogTransition, CompactDialogTransition } from "../../theme"
import DialogBody from "../Dialog/DialogBody"
import TestnetBadge from "../Dialog/TestnetBadge"
import { Box } from "../Layout/Box"
import MainTitle from "../MainTitle"
import { useOperationTitle } from "./Operations"
import ReviewForm from "./ReviewForm"

function isPaymentOperation(operation: Operation) {
  return ["createAccount", "payment"].indexOf(operation.type) > -1
}

function isOfferDeletionOperation(operation: Operation) {
  return (
    (operation.type === "manageBuyOffer" && BigNumber(operation.buyAmount).eq(0)) ||
    (operation.type === "manageSellOffer" && BigNumber(operation.amount).eq(0))
  )
}

function useTitle() {
  const getOperationTitle = useOperationTitle()
  const { t } = useTranslation()

  return function getTitle(transaction: Transaction | null): string {
    if (!transaction) {
      return t("transaction-review.title.transaction")
    } else if (transaction.operations.length === 1) {
      return getOperationTitle(transaction.operations[0])
    } else if (transaction.operations.every(isPaymentOperation)) {
      return t("transaction-review.title.payment")
    } else if (transaction.operations.every(isOfferDeletionOperation)) {
      return t("transaction-review.title.delete-orders-operation")
    } else if (isStellarWebAuthTransaction(transaction)) {
      return t("transaction-review.title.web-auth")
    } else {
      return t("transaction-review.title.transaction")
    }
  }
}

interface TransactionReviewDialogBodyProps {
  account: Account
  disabled?: boolean
  passwordError?: Error | null
  showHash?: boolean
  showSource?: boolean
  showSubmissionProgress: boolean
  signatureRequest?: SignatureRequest
  submissionProgress?: React.ReactNode
  transaction: Transaction | null
  onClose: () => void
  onSubmitTransaction: (tx: Transaction, formValues: { password: string | null }) => void
}

export function TransactionReviewDialogBody(props: TransactionReviewDialogBodyProps) {
  const dialogActionsRef = useDialogActions()
  const isSmallScreen = useIsMobile()
  const getTitle = useTitle()

  const titleContent = React.useMemo(
    () => (
      <MainTitle
        title={
          <>
            {getTitle(props.transaction) + " "}
            {props.account.testnet ? <TestnetBadge style={{ marginLeft: 8 }} /> : null}
          </>
        }
        onBack={props.onClose}
      />
    ),
    [getTitle, props.account.testnet, props.onClose, props.transaction]
  )

  return (
    <DialogBody top={titleContent} actions={props.showSubmissionProgress ? null : dialogActionsRef}>
      {props.transaction && !props.showSubmissionProgress ? (
        <Box margin={`12px ${isSmallScreen ? "4px" : "0"} 0`} textAlign="center">
          <ReviewForm
            account={props.account}
            actionsRef={dialogActionsRef}
            disabled={props.disabled}
            onClose={props.onClose}
            onConfirm={formValues => props.onSubmitTransaction(props.transaction as Transaction, formValues)}
            passwordError={props.passwordError}
            showHash={props.showHash}
            showSource={props.showSource}
            signatureRequest={props.signatureRequest}
            transaction={props.transaction}
          />
        </Box>
      ) : null}
      {props.submissionProgress}
    </DialogBody>
  )
}

interface Props {
  account: Account
  disabled?: boolean
  open: boolean
  passwordError?: Error | null
  showHash?: boolean
  showSource?: boolean
  showSubmissionProgress: boolean
  signatureRequest?: SignatureRequest
  submissionProgress?: React.ReactNode
  transaction: Transaction | null
  onClose: () => void
  onSubmitTransaction: (tx: Transaction, formValues: { password: string | null }) => void
}

function TransactionReviewDialog(props: Props) {
  const isScreen600pxWide = useMediaQuery("(min-width:600px)")
  const isSmallScreen = useIsMobile()

  return (
    <Dialog
      open={props.open}
      fullScreen={isSmallScreen}
      onClose={props.onClose}
      maxWidth="lg"
      TransitionComponent={isSmallScreen ? FullscreenDialogTransition : CompactDialogTransition}
      PaperProps={{
        style: { minWidth: isScreen600pxWide ? 500 : undefined }
      }}
    >
      <TransactionReviewDialogBody {...props} />
    </Dialog>
  )
}

export default React.memo(TransactionReviewDialog)
