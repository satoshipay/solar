import React from "react"
import { History } from "history"
import { withRouter } from "react-router-dom"
import Dialog from "@material-ui/core/Dialog"
import DialogContent from "@material-ui/core/DialogContent"
import DialogTitle from "@material-ui/core/DialogTitle"
import { Keypair } from "stellar-sdk"
import * as routes from "../../routes"
import { createAccount as createAccountInStore } from "../../stores/accounts"
import { addError } from "../../stores/notifications"
import AccountCreationForm, { AccountCreationValues } from "../Form/CreateAccount"

interface DialogProps {
  open: boolean
  onClose: () => void
  testnet: boolean
}

const CreateAccountDialog = (props: DialogProps & { history: History }) => {
  const createAccount = async (formValues: AccountCreationValues) => {
    try {
      const account = await createAccountInStore({
        name: formValues.name,
        keypair: Keypair.fromSecret(formValues.privateKey),
        password: formValues.setPassword ? formValues.password : null,
        testnet: props.testnet
      })
      props.onClose()
      props.history.push(routes.account(account.id))
    } catch (error) {
      addError(error)
    }
  }
  return (
    <Dialog open={props.open} onClose={props.onClose}>
      <DialogTitle>{props.testnet ? "Add Testnet Account" : "Add Account"}</DialogTitle>
      <DialogContent>
        <AccountCreationForm onClose={props.onClose} onSubmit={createAccount} />
      </DialogContent>
    </Dialog>
  )
}

export default withRouter<any>(CreateAccountDialog)
