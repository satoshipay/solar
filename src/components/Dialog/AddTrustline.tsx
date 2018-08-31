import React from "react"
import { Asset, Transaction } from "stellar-sdk"
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
import { mainnet as mainnetPopularAssets, testnet as testnetPopularAssets } from "../../lib/popularAssets"
import { Account } from "../../stores/accounts"
import { addError } from "../../stores/notifications"
import { HorizontalLayout } from "../Layout/Box"
import TxConfirmationDrawer from "./TransactionConfirmation"

interface FormValues {
  code: string
  issuerPublicKey: string
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
        value={props.formValues.code}
        onChange={event => props.setFormValue("code", event.target.value)}
      />
      <TextField
        fullWidth
        label="Issuer"
        placeholder="Issuing account public key"
        margin="dense"
        value={props.formValues.issuerPublicKey}
        onChange={event => props.setFormValue("issuerPublicKey", event.target.value)}
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
  open: boolean
  onClose: () => void
}

interface State {
  formValues: FormValues
  showForm: boolean
  transaction: Transaction | null
}

class AddTrustlineDialog extends React.Component<Props, State> {
  state = {
    formValues: {
      code: "",
      issuerPublicKey: ""
    },
    showForm: false,
    transaction: null
  }

  addAsset = async (asset: Asset) => {
    try {
      // TODO
    } catch (error) {
      addError(error)
    }
  }

  addCustomAsset = async ({ code, issuerPublicKey }: FormValues) => {
    try {
      await this.addAsset(new Asset(code, issuerPublicKey))
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

  clearTransaction = () => {
    this.setState({ transaction: null })
  }

  submitTransaction = (transaction: Transaction, formValues: { password: string | null }) => {
    // TODO: Sign transaction
    // TODO: Submit transaction
    // TODO: Close dialog
  }

  render() {
    const popularAssets = this.props.account.testnet ? testnetPopularAssets : mainnetPopularAssets
    return (
      <>
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
        <TxConfirmationDrawer
          open={Boolean(this.props.open && this.state.transaction)}
          account={this.props.account}
          transaction={this.state.transaction}
          onClose={this.clearTransaction}
          onSubmitTransaction={this.submitTransaction}
        />
      </>
    )
  }
}

export default AddTrustlineDialog
