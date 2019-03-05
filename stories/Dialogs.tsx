import React from "react"
import Button from "@material-ui/core/Button"
import { storiesOf } from "@storybook/react"
import { Asset, Server, Transaction } from "stellar-sdk"
import TxConfirmationDrawer from "../src/components/Dialog/TransactionConfirmation"
import { Account, AccountsContext, AccountsProvider } from "../src/context/accounts"
import { useAccountData } from "../src/hooks"
import { createPaymentOperation, createTransaction } from "../src/lib/transaction"

interface DialogContainerProps {
  account: Account
  children: (props: { open: boolean; onClose: () => void; transaction: Transaction }) => React.ReactNode
}

function DialogContainer(props: DialogContainerProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [transaction, setTransaction] = React.useState<Transaction | null>(null)
  const accountData = useAccountData(props.account.publicKey, props.account.testnet)

  React.useEffect(() => {
    const createDemoTx = async () => {
      return createTransaction(
        [
          await createPaymentOperation({
            amount: "1",
            asset: Asset.native(),
            destination: "GA2CZKBI2C55WHALSTNPG54FOQCLC6Y4EIATZEIJOXWQPSEGN4CWAXFT",
            horizon: new Server("https://horizon-testnet.stellar.org")
          })
        ],
        {
          accountData,
          horizon: new Server("https://horizon-testnet.stellar.org"),
          walletAccount: props.account
        }
      )
    }
    createDemoTx().then(tx => setTransaction(tx))
  }, [])

  return (
    <AccountsProvider>
      <Button onClick={() => setIsOpen(true)} variant="contained">
        Open
      </Button>
      {transaction
        ? props.children({
            open: isOpen,
            onClose: () => setIsOpen(false),
            transaction: (transaction as any) as Transaction
          })
        : null}
    </AccountsProvider>
  )
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
