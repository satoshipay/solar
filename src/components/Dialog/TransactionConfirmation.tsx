import React from "react"
import Dialog from "@material-ui/core/Dialog"
import Slide, { SlideProps } from "@material-ui/core/Slide"
import Typography from "@material-ui/core/Typography"
import { Transaction, TransactionOperation } from "stellar-sdk"
import { Account } from "../../context/accounts"
import TxConfirmationForm from "../Form/TxConfirmation"
import { Box } from "../Layout/Box"
import TestnetBadge from "./TestnetBadge"

const isPaymentOperation = (operation: TransactionOperation) =>
  ["createAccount", "payment"].indexOf(operation.type) > -1

const Transition = (props: SlideProps) => <Slide {...props} direction="up" />

interface TxConfirmationDialogProps {
  account: Account
  disabled?: boolean
  open: boolean
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
    <Dialog open={props.open} onClose={props.onClose} maxWidth="lg" TransitionComponent={Transition}>
      <Box padding="24px 36px" overflow="auto">
        <Typography variant="headline" component="h2">
          {title} {props.account.testnet ? <TestnetBadge style={{ marginLeft: 8 }} /> : null}
        </Typography>
        {props.transaction ? (
          <div style={{ marginTop: 8 }}>
            <TxConfirmationForm
              transaction={props.transaction}
              account={props.account}
              disabled={props.disabled}
              onConfirm={formValues => props.onSubmitTransaction(props.transaction as Transaction, formValues)}
              onCancel={props.onClose}
            />
          </div>
        ) : null}
      </Box>
      {props.submissionProgress}
    </Dialog>
  )
}

export default TxConfirmationDialog
