import React from "react"
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

interface PaymentFormDrawerProps {
  account: Account
  open: boolean
  onClose: () => void
  onSubmit: (values: PaymentCreationValues) => void
}

const PaymentFormDrawer = (props: PaymentFormDrawerProps) => {
  return (
    <Drawer open={props.open} anchor="right" onClose={props.onClose}>
      <Card
        style={{
          position: "relative",
          height: "100%",
          padding: "0 12px",
          width: "90vw",
          maxWidth: "700px"
        }}
      >
        <CloseButton onClick={props.onClose} />
        <CardContent>
          <Typography variant="headline" component="h2">
            Send payment
          </Typography>
          <Typography gutterBottom variant="subheading" component="h3">
            {props.account.testnet ? "Testnet" : null}
          </Typography>
          <div style={{ marginTop: 32 }}>
            <CreatePaymentForm onSubmit={props.onSubmit} />
          </div>
        </CardContent>
      </Card>
    </Drawer>
  )
}

interface TxConfirmationDrawerProps {
  account: Account
  open: boolean
  transaction: Transaction | null
  onClose: () => void
  onSubmitTransaction: (tx: Transaction) => void
}

const TxConfirmationDrawer = (props: TxConfirmationDrawerProps) => {
  return (
    <Drawer open={props.open} anchor="right" onClose={props.onClose}>
      <Card style={{ position: "relative", height: "100%", padding: "0 12px" }}>
        <CardContent>
          <Typography variant="headline" component="h2">
            Confirm payment
          </Typography>
          <Typography gutterBottom variant="subheading" component="h3">
            {props.account.testnet ? "Testnet" : null}
          </Typography>
          {props.transaction ? (
            <TxConfirmationForm
              transaction={props.transaction}
              account={props.account}
              onConfirm={props.onSubmitTransaction}
              onCancel={props.onClose}
            />
          ) : null}
        </CardContent>
      </Card>
    </Drawer>
  )
}

interface CreatePaymentDrawerProps {
  account: Account
  open: boolean
  transaction: Transaction | null
  clearTransaction: () => any
  setTransaction: (tx: Transaction) => void
  submissionPromise: Promise<any> | null
  setSubmissionPromise: (promise: Promise<any>) => void
  onClose: () => void
  onPaymentFormSubmission: (formValues: PaymentCreationValues) => void
  onSubmitTransaction: (tx: Transaction) => void
}

const CreatePaymentDrawer = (props: CreatePaymentDrawerProps) => {
  return (
    <>
      <PaymentFormDrawer
        open={props.open}
        account={props.account}
        onClose={props.onClose}
        onSubmit={props.onPaymentFormSubmission}
      />
      <TxConfirmationDrawer
        open={Boolean(props.open && props.transaction)}
        account={props.account}
        transaction={props.transaction}
        onClose={props.clearTransaction}
        onSubmitTransaction={props.onSubmitTransaction}
      />
      {props.submissionPromise ? (
        <SubmissionProgressOverlay
          open
          submissionPromise={props.submissionPromise}
        />
      ) : null}
    </>
  )
}

interface StatefulCreatePaymentDrawerProps {
  account: Account
  open: boolean
  onClose: () => void
}

interface State {
  submissionPromise: Promise<any> | null
  transaction: Transaction | null
}

class StatefulCreatePaymentDrawer extends React.Component<
  StatefulCreatePaymentDrawerProps & HorizonProps,
  State
> {
  state = {
    submissionPromise: null,
    transaction: null
  }

  getHorizon = () => {
    return this.props.account.testnet
      ? this.props.horizonTestnet
      : this.props.horizonLivenet
  }

  clearTransaction = () => {
    this.setState({ transaction: null })
  }

  setTransaction = (transaction: Transaction) => {
    this.setState({ transaction })
  }

  setSubmissionPromise = (submissionPromise: Promise<any>) => {
    this.setState({ submissionPromise })
  }

  runErrorHandled = async <Result extends any>(fn: () => Result) => {
    try {
      await fn()
    } catch (error) {
      // TODO: Error handling
    }
  }

  createTransaction = (formValues: PaymentCreationValues) => {
    this.runErrorHandled(async () => {
      const tx = await createTransaction({
        ...formValues,
        horizon: this.getHorizon(),
        walletAccount: this.props.account,
        testnet: this.props.account.testnet
      })
      this.setTransaction(tx)
    })
  }

  submitSignedTx = (tx: Transaction) => {
    this.runErrorHandled(async () => {
      const horizon = this.getHorizon()
      const promise = horizon.submitTransaction(tx)
      this.setSubmissionPromise(promise)

      await promise

      // Close automatically a second after successful submission
      setTimeout(() => this.props.onClose(), 1000)
    })
  }

  render() {
    return (
      <CreatePaymentDrawer
        account={this.props.account}
        open={this.props.open}
        onClose={this.props.onClose}
        setSubmissionPromise={this.setSubmissionPromise}
        submissionPromise={this.state.submissionPromise}
        clearTransaction={this.clearTransaction}
        setTransaction={this.setTransaction}
        transaction={this.state.transaction}
        onPaymentFormSubmission={this.createTransaction}
        onSubmitTransaction={this.submitSignedTx}
      />
    )
  }
}

export default withHorizon(StatefulCreatePaymentDrawer)
