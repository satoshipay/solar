import React from "react"
import { compose, withHandlers, withState } from "recompose"
import Dialog from "@material-ui/core/Dialog"
import DialogContent from "@material-ui/core/DialogContent"
import Drawer from "@material-ui/core/Drawer"
import Card from "@material-ui/core/Card"
import CardContent from "@material-ui/core/CardContent"
import Typography from "@material-ui/core/Typography"
import CloseIcon from "react-icons/lib/md/close"
import { Transaction } from "stellar-sdk"
import { createTransaction } from "../../lib/transaction"
import { Account } from "../../stores/accounts"
import { withHorizon, HorizonProps } from "../../hocs"
import CreatePaymentForm, { PaymentCreationValues } from "../Form/CreatePayment"
import TxConfirmationForm from "../Form/TxConfirmation"
import SubmissionProgress from "../SubmissionProgress"

const CloseButton = (props: { onClick: (event: React.MouseEvent) => any }) => {
  const style: React.CSSProperties = {
    position: "absolute",
    top: 16,
    right: 24,
    cursor: "pointer",
    lineHeight: 0
  }
  return (
    <div style={style} onClick={props.onClick}>
      <CloseIcon style={{ width: 32, height: 32 }} />
    </div>
  )
}

const SubmissionProgressOverlay = (props: {
  open: boolean
  submissionPromise: Promise<any>
}) => {
  return (
    <Dialog open={props.open} PaperProps={{ elevation: 20 }}>
      <DialogContent>
        <SubmissionProgress promise={props.submissionPromise} />
      </DialogContent>
    </Dialog>
  )
}

interface CreatePaymentDrawerProps {
  account: Account
  open: boolean
  onClose: () => any
}

interface CreatePaymentDrawerStateProps {
  transaction: Transaction
  clearTransaction: () => any
  setTransaction: (tx: Transaction) => any
  submissionPromise: Promise<any> | null
  setSubmissionPromise: (promise: Promise<any>) => any
}

const CreatePaymentDrawer = (
  props: CreatePaymentDrawerProps & CreatePaymentDrawerStateProps & HorizonProps
) => {
  const {
    horizonLivenet,
    horizonTestnet,
    account,
    open = true,
    transaction,
    clearTransaction,
    setTransaction,
    submissionPromise,
    setSubmissionPromise,
    onClose = () => undefined
  } = props

  const horizon = account.testnet ? horizonTestnet : horizonLivenet

  const handleCreationFormSubmit = async (
    formValues: PaymentCreationValues
  ) => {
    const tx = await createTransaction({
      ...formValues,
      horizon,
      walletAccount: account,
      testnet: account.testnet
    })
    setTransaction(tx)
    // TODO: Error handling
  }
  const submitSignedTx = (tx: Transaction) => {
    const promise = horizon.submitTransaction(tx)
    setSubmissionPromise(promise)

    promise
      .then(() => {
        // Close automatically a second after successful submission
        setTimeout(() => onClose(), 1000)
      })
      .catch(error => {
        throw error
        // TODO: Error handling
      })
  }

  return (
    <>
      <Drawer open={open} anchor="right" onClose={onClose}>
        <Card
          style={{
            position: "relative",
            height: "100%",
            padding: "0 12px",
            width: "90vw",
            maxWidth: "700px"
          }}
        >
          <CloseButton onClick={onClose} />
          <CardContent>
            <Typography variant="headline" component="h2">
              Send payment
            </Typography>
            <Typography gutterBottom variant="subheading" component="h3">
              {account.testnet ? "Testnet" : null}
            </Typography>
            <div style={{ marginTop: 32 }}>
              <CreatePaymentForm onSubmit={handleCreationFormSubmit} />
            </div>
          </CardContent>
        </Card>
      </Drawer>
      <Drawer
        open={Boolean(open && transaction)}
        anchor="right"
        onClose={clearTransaction}
      >
        <Card
          style={{ position: "relative", height: "100%", padding: "0 12px" }}
        >
          <CardContent>
            <Typography variant="headline" component="h2">
              Confirm payment
            </Typography>
            <Typography gutterBottom variant="subheading" component="h3">
              {account.testnet ? "Testnet" : null}
            </Typography>
            {transaction ? (
              <TxConfirmationForm
                transaction={transaction}
                account={account}
                onConfirm={submitSignedTx}
                onCancel={clearTransaction}
              />
            ) : null}
          </CardContent>
        </Card>
      </Drawer>
      {submissionPromise ? (
        <SubmissionProgressOverlay open submissionPromise={submissionPromise} />
      ) : null}
    </>
  )
}

const StatefulCreatePaymentDrawer = compose<
  CreatePaymentDrawerProps & CreatePaymentDrawerStateProps & HorizonProps,
  CreatePaymentDrawerProps & HorizonProps
>(
  withState("transaction", "setTransaction", null),
  withState("submissionPromise", "setSubmissionPromise", null),
  withHandlers<{ setTransaction: (tx: Transaction | null) => any }, {}>({
    clearTransaction: ({ setTransaction }) => () => setTransaction(null)
  })
)(CreatePaymentDrawer)

export default withHorizon(StatefulCreatePaymentDrawer)
