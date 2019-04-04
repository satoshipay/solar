import React from "react"
import Dialog from "@material-ui/core/Dialog"
import Slide from "@material-ui/core/Slide"
import { Operation, Transaction } from "stellar-sdk"
import { Account } from "../../context/accounts"
import { SignatureRequest } from "../../lib/multisig-service"
import ErrorBoundary from "../ErrorBoundary"
import TxConfirmationForm from "../Form/TxConfirmation"
import { Box } from "../Layout/Box"
import MainTitle from "../MainTitle"
import TestnetBadge from "./TestnetBadge"

const isPaymentOperation = (operation: Operation) => ["createAccount", "payment"].indexOf(operation.type) > -1

const Transition = (props: any) => <Slide {...props} direction="up" />

interface TxConfirmationDialogProps {
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

function TxConfirmationDialog(props: TxConfirmationDialogProps) {
  const title =
    props.transaction && props.transaction.operations.every(isPaymentOperation)
      ? "Confirm Payment"
      : "Confirm Transaction"

  return (
    <Dialog open={props.open} fullScreen onClose={props.onClose} maxWidth="lg" TransitionComponent={Transition}>
      <ErrorBoundary>
        <Box padding="24px 36px" overflow="auto">
          <MainTitle
            title={
              <span>
                {title} {props.account.testnet ? <TestnetBadge style={{ marginLeft: 8 }} /> : null}
              </span>
            }
            onBack={props.onClose}
          />
          {props.transaction ? (
            <Box margin="8px 0 0">
              <TxConfirmationForm
                account={props.account}
                disabled={props.disabled}
                onConfirm={formValues => props.onSubmitTransaction(props.transaction as Transaction, formValues)}
                onCancel={props.onClose}
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

export default TxConfirmationDialog
