import React from "react"
import Button from "@material-ui/core/Button"
import { storiesOf } from "@storybook/react"
import { Asset, Server, Transaction } from "stellar-sdk"
import TxConfirmationDrawer from "../src/components/Dialog/TransactionConfirmation"
import { Account, AccountsContext, AccountsProvider } from "../src/context/accounts"
import { createPaymentOperation, createTransaction } from "../src/lib/transaction"

interface DialogContainerProps {
  account: Account
  children: (props: { open: boolean; onClose: () => void; transaction: Transaction }) => React.ReactNode
}

class DialogContainer extends React.Component<DialogContainerProps> {
  state = {
    open: false,
    transaction: null
  }

  async componentDidMount() {
    createTransaction(
      [
        await createPaymentOperation({
          amount: "1",
          asset: Asset.native(),
          destination: "GA2CZKBI2C55WHALSTNPG54FOQCLC6Y4EIATZEIJOXWQPSEGN4CWAXFT",
          horizon: new Server("https://horizon-testnet.stellar.org")
        })
      ],
      {
        horizon: new Server("https://horizon-testnet.stellar.org"),
        walletAccount: this.props.account
      }
    ).then(transaction => this.setState({ transaction }))
  }

  render() {
    return (
      <AccountsProvider>
        <Button onClick={() => this.setState({ open: true })} variant="contained">
          Open
        </Button>
        {this.state.transaction
          ? this.props.children({
              open: this.state.open,
              onClose: () => this.setState({ open: false }),
              transaction: (this.state.transaction as any) as Transaction
            })
          : null}
      </AccountsProvider>
    )
  }
}

storiesOf("Dialogs", module)
  .add("TxConfirmationDrawer without password", () => (
    <AccountsContext.Consumer>
      {({ accounts }) => (
        <DialogContainer account={accounts[0]}>
          {({ open, onClose, transaction }) => (
            <TxConfirmationDrawer
              account={accounts[0]}
              open={open}
              transaction={transaction}
              onClose={onClose}
              onSubmitTransaction={() => undefined}
            />
          )}
        </DialogContainer>
      )}
    </AccountsContext.Consumer>
  ))
  .add("TxConfirmationDrawer with password", () => (
    <AccountsContext.Consumer>
      {({ accounts }) => (
        <DialogContainer account={accounts[1]}>
          {({ open, onClose, transaction }) => (
            <TxConfirmationDrawer
              account={accounts[1]}
              open={open}
              transaction={transaction}
              onClose={onClose}
              onSubmitTransaction={() => undefined}
            />
          )}
        </DialogContainer>
      )}
    </AccountsContext.Consumer>
  ))
