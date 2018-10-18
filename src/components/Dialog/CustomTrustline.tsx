import React from "react"
import { Asset, Operation, Server, Transaction } from "stellar-sdk"
import Button from "@material-ui/core/Button"
import CircularProgress from "@material-ui/core/CircularProgress"
import Dialog from "@material-ui/core/Dialog"
import DialogContent from "@material-ui/core/DialogContent"
import DialogTitle from "@material-ui/core/DialogTitle"
import TextField from "@material-ui/core/TextField"
import { createTransaction } from "../../lib/transaction"
import { Account } from "../../stores/accounts"
import { addError } from "../../stores/notifications"
import { HorizontalLayout } from "../Layout/Box"
import TransactionSender from "../TransactionSender"
import CloseButton from "./CloseButton"

type Omit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>

interface FormValues {
  code: string
  issuerPublicKey: string
  limit: string
}

interface FormProps {
  formValues: FormValues
  txCreationPending: boolean
  setFormValue: (fieldName: keyof FormValues, value: string) => void
  onSubmit: (formValues: FormValues) => void
}

const CustomTrustlineForm = (props: FormProps) => {
  return (
    <form style={{ display: "block", width: "100%" }}>
      <TextField
        label="Code"
        placeholder="EURT, USDT, BTC, ..."
        autoFocus
        margin="dense"
        name="asset-code"
        value={props.formValues.code}
        onChange={event => props.setFormValue("code", event.target.value)}
      />
      <TextField
        fullWidth
        label="Issuer"
        placeholder="Issuing account public key"
        margin="dense"
        name="asset-issuer"
        value={props.formValues.issuerPublicKey}
        onChange={event => props.setFormValue("issuerPublicKey", event.target.value)}
      />
      <TextField
        fullWidth
        label="Limit (optional)"
        placeholder="Limit trust in this asset / maximum balance to hold"
        margin="dense"
        name="trust-limit"
        value={props.formValues.limit}
        onChange={event => props.setFormValue("limit", event.target.value)}
      />
      <HorizontalLayout margin="32px 0 0" justifyContent="flex-end">
        <Button variant="contained" color="primary" onClick={() => props.onSubmit(props.formValues)}>
          {props.txCreationPending ? (
            <CircularProgress size="1.5em" style={{ color: "white", marginRight: 12 }} />
          ) : null}
          Trust Asset
        </Button>
      </HorizontalLayout>
    </form>
  )
}

interface Props {
  account: Account
  horizon: Server
  open: boolean
  onClose: () => void
  sendTransaction: (transaction: Transaction) => void
}

interface State {
  formValues: FormValues
  txCreationPending: boolean
}

class CustomTrustlineDialog extends React.Component<Props, State> {
  state = {
    formValues: {
      code: "",
      issuerPublicKey: "",
      limit: ""
    },
    txCreationPending: false
  }

  addAsset = async (asset: Asset, options: { limit?: string } = {}) => {
    try {
      const operations = [Operation.changeTrust({ asset, limit: options.limit })]

      this.setState({ txCreationPending: true })
      const transaction = await createTransaction(operations, {
        horizon: this.props.horizon,
        walletAccount: this.props.account
      })

      this.setState({ txCreationPending: false })
      this.props.sendTransaction(transaction)
    } catch (error) {
      this.setState({ txCreationPending: false })
      addError(error)
    }
  }

  addCustomAsset = async ({ code, issuerPublicKey, limit }: FormValues) => {
    try {
      await this.addAsset(new Asset(code, issuerPublicKey), { limit: limit || undefined })
    } catch (error) {
      addError(error)
    }
  }

  setFormValue = (formName: keyof FormValues, value: string) => {
    this.setState({
      formValues: {
        ...this.state.formValues,
        [formName]: value
      }
    })
  }

  render() {
    return (
      <Dialog open={this.props.open} onClose={this.props.onClose}>
        <CloseButton onClick={this.props.onClose} />
        <DialogTitle>Add Custom Asset</DialogTitle>
        <DialogContent>
          <CustomTrustlineForm
            formValues={this.state.formValues}
            onSubmit={this.addCustomAsset}
            setFormValue={this.setFormValue}
            txCreationPending={this.state.txCreationPending}
          />
        </DialogContent>
      </Dialog>
    )
  }
}

const CustomTrustlineDialogContainer = (props: Omit<Props, "horizon" | "sendTransaction">) => {
  const closeAfterTimeout = () => {
    // Close automatically a second after successful submission
    setTimeout(() => props.onClose(), 1000)
  }
  return (
    <TransactionSender account={props.account} onSubmissionCompleted={closeAfterTimeout}>
      {({ horizon, sendTransaction }) => (
        <CustomTrustlineDialog {...props} horizon={horizon} sendTransaction={sendTransaction} />
      )}
    </TransactionSender>
  )
}

export default CustomTrustlineDialogContainer
