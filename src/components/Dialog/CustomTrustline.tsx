import React from "react"
import { Asset, Operation, Server, Transaction } from "stellar-sdk"
import Button from "@material-ui/core/Button"
import Dialog from "@material-ui/core/Dialog"
import DialogContent from "@material-ui/core/DialogContent"
import DialogTitle from "@material-ui/core/DialogTitle"
import Slide, { SlideProps } from "@material-ui/core/Slide"
import TextField from "@material-ui/core/TextField"
import VerifiedUserIcon from "@material-ui/icons/VerifiedUser"
import { Account } from "../../context/accounts"
import { addError } from "../../context/notifications"
import { createTransaction } from "../../lib/transaction"
import { HorizontalLayout } from "../Layout/Box"
import ButtonIconLabel from "../ButtonIconLabel"

const Transition = (props: SlideProps) => <Slide {...props} direction="up" />

interface FormValues {
  code: string
  issuerPublicKey: string
  limit: string
}

interface FormProps {
  formValues: FormValues
  txCreationPending: boolean
  setFormValue: (fieldName: keyof FormValues, value: string) => void
  onClose: () => void
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
        <Button
          variant="contained"
          color="primary"
          onClick={() => props.onSubmit(props.formValues)}
          style={{ marginRight: 32 }}
        >
          <ButtonIconLabel label="Trust Asset" loading={props.txCreationPending}>
            <VerifiedUserIcon />
          </ButtonIconLabel>
        </Button>
        <Button variant="contained" onClick={props.onClose}>
          Cancel
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
      <Dialog open={this.props.open} onClose={this.props.onClose} TransitionComponent={Transition}>
        <DialogTitle>Add Custom Asset</DialogTitle>
        <DialogContent>
          <CustomTrustlineForm
            formValues={this.state.formValues}
            onClose={this.props.onClose}
            onSubmit={this.addCustomAsset}
            setFormValue={this.setFormValue}
            txCreationPending={this.state.txCreationPending}
          />
        </DialogContent>
      </Dialog>
    )
  }
}

export default CustomTrustlineDialog
