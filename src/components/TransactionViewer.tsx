import React from "react"
import { Transaction } from "stellar-sdk"
import { Account } from "../context/accounts"
import { SignatureRequest } from "../lib/multisig-service"
import TxConfirmationDrawer from "./Dialog/TransactionConfirmation"

interface RenderFunctionProps {
  openDialog: (transaction: Transaction, signatureRequest?: SignatureRequest | null) => void
}

interface Props {
  account: Account
  children: (props: RenderFunctionProps) => React.ReactNode
}

interface State {
  dialogOpen: boolean
  signatureRequest: SignatureRequest | null
  transaction: Transaction | null
}

class TransactionViewer extends React.Component<Props, State> {
  state: State = {
    dialogOpen: false,
    signatureRequest: null,
    transaction: null
  }

  setTransaction = (transaction: Transaction, signatureRequest: SignatureRequest | null = null) => {
    this.setState({ dialogOpen: true, signatureRequest, transaction })
  }

  onDrawerCloseRequest = () => {
    this.setState({
      dialogOpen: false
    })
  }

  render() {
    const { dialogOpen: dialogOpen, signatureRequest, transaction } = this.state

    const content = this.props.children({
      openDialog: this.setTransaction
    })

    return (
      <>
        {content}
        <TxConfirmationDrawer
          open={dialogOpen}
          account={this.props.account}
          disabled={true}
          signatureRequest={signatureRequest || undefined}
          transaction={transaction}
          onClose={this.onDrawerCloseRequest}
          onSubmitTransaction={() => undefined}
        />
      </>
    )
  }
}

export default TransactionViewer
