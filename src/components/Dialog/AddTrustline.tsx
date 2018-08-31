import React from "react"
import { Asset, Operation, Server, Transaction } from "stellar-sdk"
import Button from "@material-ui/core/Button"
import Dialog from "@material-ui/core/Dialog"
import DialogContent from "@material-ui/core/DialogContent"
import DialogTitle from "@material-ui/core/DialogTitle"
import Divider from "@material-ui/core/Divider"
import List from "@material-ui/core/List"
import ListItem from "@material-ui/core/ListItem"
import ListItemIcon from "@material-ui/core/ListItemIcon"
import ListItemText from "@material-ui/core/ListItemText"
import TextField from "@material-ui/core/TextField"
import EditIcon from "@material-ui/icons/Edit"
import { isWrongPasswordError } from "../../lib/errors"
import { mainnet as mainnetPopularAssets, testnet as testnetPopularAssets } from "../../lib/popularAssets"
import { createTransaction } from "../../lib/transaction"
import { Account } from "../../stores/accounts"
import { addError } from "../../stores/notifications"
import { HorizontalLayout } from "../Layout/Box"
import { Horizon } from "../Subscribers"
import TransactionSender from "../TransactionSender"
import TxConfirmationDrawer from "./TransactionConfirmation"

type Omit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>

interface FormValues {
  code: string
  issuerPublicKey: string
  limit: string
}

interface FormProps {
  formValues: FormValues
  setFormValue: (fieldName: keyof FormValues, value: string) => void
  onSubmit: (formValues: FormValues) => void
}

const CustomTrustlineForm = (props: FormProps) => {
  return (
    <form style={{ display: "block", width: "100%" }}>
      <TextField
        label="Code"
        placeholder="EURT, USDT, BTC, ..."
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
  showForm: boolean
}

class AddTrustlineDialog extends React.Component<Props, State> {
  state = {
    formValues: {
      code: "",
      issuerPublicKey: "",
      limit: ""
    },
    showForm: false
  }

  addAsset = async (asset: Asset, options: { limit?: string } = {}) => {
    try {
      const operations = [Operation.changeTrust({ asset, limit: options.limit })]
      const transaction = await createTransaction(operations, {
        horizon: this.props.horizon,
        walletAccount: this.props.account
      })
      this.props.sendTransaction(transaction)
    } catch (error) {
      addError(error)
    }
  }

  addCustomAsset = async ({ code, issuerPublicKey, limit }: FormValues) => {
    try {
      await this.addAsset(new Asset(code, issuerPublicKey), { limit })
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

  showForm = () => {
    this.setState({ showForm: true })
  }

  render() {
    const { account } = this.props
    const popularAssets = account.testnet ? testnetPopularAssets : mainnetPopularAssets

    return (
      <Dialog open={this.props.open} onClose={this.props.onClose}>
        <DialogTitle>Add Asset</DialogTitle>
        <DialogContent>
          <List style={{ maxHeight: "70%", overflowY: "auto" }}>
            {popularAssets.map(asset => (
              <ListItem key={[asset.issuer, asset.code].join("")} button onClick={() => this.addAsset(asset)}>
                <ListItemText primary={asset.code} secondary={asset.issuer} />
              </ListItem>
            ))}
            {this.state.showForm ? (
              <>
                <Divider />
                <ListItem style={{ paddingTop: 0 }}>
                  <CustomTrustlineForm
                    formValues={this.state.formValues}
                    onSubmit={this.addCustomAsset}
                    setFormValue={this.setFormValue}
                  />
                </ListItem>
              </>
            ) : (
              <ListItem style={{ justifyContent: "center" }}>
                <Button onClick={this.showForm}>
                  <EditIcon style={{ marginRight: 8 }} />
                  Enter custom asset
                </Button>
              </ListItem>
            )}
          </List>
        </DialogContent>
      </Dialog>
    )
  }
}

const ConnectedAddTrustlineDialog = (props: Omit<Props, "horizon" | "sendTransaction">) => {
  const closeAfterTimeout = () => {
    // Close automatically a second after successful submission
    setTimeout(() => props.onClose(), 1000)
  }
  return (
    <TransactionSender account={props.account} onSubmissionCompleted={closeAfterTimeout}>
      {({ horizon, sendTransaction }) => (
        <AddTrustlineDialog {...props} horizon={horizon} sendTransaction={sendTransaction} />
      )}
    </TransactionSender>
  )
}

export default ConnectedAddTrustlineDialog
