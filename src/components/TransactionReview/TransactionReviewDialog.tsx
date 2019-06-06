import BigNumber from "big.js"
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

function isPaymentOperation(operation: Operation) {
  return ["createAccount", "payment"].indexOf(operation.type) > -1
}

function isOfferDeletionOperation(operation: Operation) {
  return (
    (operation.type === "manageBuyOffer" && BigNumber(operation.buyAmount).eq(0)) ||
    (operation.type === "manageSellOffer" && BigNumber(operation.amount).eq(0))
  )
}

const TransitionLeft = (props: any) => <Slide {...props} direction="left" />
const TransitionUp = (props: any) => <Slide {...props} direction="up" />

function Title(props: { disabled?: boolean; transaction: Transaction | null }) {
  if (!props.transaction) {
    return <>Review Transaction</>
  } else if (props.transaction.operations.every(isPaymentOperation)) {
    return <>{props.disabled ? "Review Payment" : "Confirm Payment"}</>
  } else if (props.transaction.operations.every(isOfferDeletionOperation)) {
    return <>{props.disabled ? "Review Transaction" : "Delete Offer"}</>
  } else {
    return <>{props.disabled ? "Review Transaction" : "Confirm Transaction"}</>
  }
}

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
                <Title disabled={props.disabled} transaction={props.transaction} />{" "}
                {props.account.testnet ? <TestnetBadge style={{ marginLeft: 8 }} /> : null}
              </>
            }
            onBack={props.onClose}
          />
          {props.transaction ? (
            <Box margin="24px auto 0" textAlign="center">
              <ReviewForm
                account={props.account}
                disabled={props.disabled}
                onClose={props.onClose}
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
