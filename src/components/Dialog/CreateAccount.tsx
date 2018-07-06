import React from "react"
import { History } from "history"
import { withRouter } from "react-router-dom"
import Dialog from "@material-ui/core/Dialog"
import DialogContent from "@material-ui/core/DialogContent"
import DialogTitle from "@material-ui/core/DialogTitle"
import { Keypair } from "stellar-sdk"
import * as routes from "../../lib/routes"
import { createAccount as createAccountInStore } from "../../stores/accounts"
import AccountCreationForm, {
  AccountCreationValues
} from "../Form/CreateAccount"

interface DialogProps {
  open: boolean
  onClose: () => void
  testnet: boolean
}

const CreateAccountDialog = (props: DialogProps & { history: History }) => {
  const createAccount = (formValues: AccountCreationValues) => {
    const account = createAccountInStore({
      name: formValues.name,
      keypair: Keypair.fromSecret(formValues.privateKey),
      password: null,
      testnet: props.testnet
    })
    props.onClose()
    props.history.push(routes.account(account.id))
  }
  return (
    <Dialog open={props.open} onClose={props.onClose}>
      <DialogTitle>
        {props.testnet ? "Create Testnet Account" : "Create Account"}
      </DialogTitle>
      <DialogContent>
        <AccountCreationForm onSubmit={createAccount} />
      </DialogContent>
    </Dialog>
  )
}

export default withRouter<any>(CreateAccountDialog)
