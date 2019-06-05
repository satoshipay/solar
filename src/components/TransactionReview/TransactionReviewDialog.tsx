import React from "react"
import Dialog from "@material-ui/core/Dialog"
import Slide from "@material-ui/core/Slide"
import { Operation, Transaction } from "stellar-sdk"
import { Account } from "../../context/accounts"
import { SignatureRequest } from "../../lib/multisig-service"
import { useIsMobile } from "../../hooks"
import TestnetBadge from "../Dialog/TestnetBadge"
import ErrorBoundary from "../ErrorBoundary"
import { Box } from "../Layout/Box"
import MainTitle from "../MainTitle"
import ReviewForm from "./ReviewForm"

const isPaymentOperation = (operation: Operation) => ["createAccount", "payment"].indexOf(operation.type) > -1

const TransitionLeft = (props: any) => <Slide {...props} direction="left" />
const TransitionUp = (props: any) => <Slide {...props} direction="up" />

interface Props {
  account: Account
  disabled?: boolean
  open: boolean
  passwordError?: Error | null
  signatureRequest?: SignatureRequest
  submissionProgress?: React.ReactNode
  transaction: Transaction | null
  onClose: () => void
  onSubmitTransaction: (tx: Transaction, formValues: { password: string | null }) => void
}

function TransactionReviewDialog(props: Props) {
  const title =
    props.transaction && props.transaction.operations.every(isPaymentOperation)
      ? props.disabled
        ? "Review Payment"
        : "Confirm Payment"
      : props.disabled
        ? "Review Transaction"
        : "Confirm Transaction"

  const isSmallScreen = useIsMobile()

  return (
    <Dialog
      open={props.open}
      fullScreen={isSmallScreen}
      onClose={props.onClose}
      maxWidth="lg"
      TransitionComponent={isSmallScreen ? TransitionLeft : TransitionUp}
    >
      <ErrorBoundary>
        <Box padding={isSmallScreen ? "24px" : " 24px 32px"} overflow="auto">
          <MainTitle
            title={
              <>
                {title} {props.account.testnet ? <TestnetBadge style={{ marginLeft: 8 }} /> : null}
              </>
            }
            onBack={props.onClose}
          />
          {props.transaction ? (
            <Box margin="24px auto 0" textAlign="center">
              <ReviewForm
                account={props.account}
                disabled={props.disabled}
                onConfirm={formValues => props.onSubmitTransaction(props.transaction as Transaction, formValues)}
                passwordError={props.passwordError}
                signatureRequest={props.signatureRequest}
                transaction={props.transaction}
              />
            </Box>
          ) : null}
        </Box>
        {props.submissionProgress}
      </ErrorBoundary>
    </Dialog>
  )
}

export default TransactionReviewDialog