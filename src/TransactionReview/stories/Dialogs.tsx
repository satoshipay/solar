import React from "react"
import Button from "@material-ui/core/Button"
import { storiesOf } from "@storybook/react"
import { Asset, Server, Transaction } from "stellar-sdk"
import TransactionReviewDialog from "../components/TransactionReviewDialog"
import { Account, AccountsContext, AccountsProvider } from "~App/contexts/accounts"
import { useLiveAccountData } from "~Generic/hooks/stellar-subscriptions"
import { createPaymentOperation, createTransaction } from "~Generic/lib/transaction"

interface DialogContainerProps {
  account: Account
  children: (props: { open: boolean; onClose: () => void; transaction: Transaction }) => React.ReactNode
}

function DialogContainer(props: DialogContainerProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [transaction, setTransaction] = React.useState<Transaction | null>(null)
  const accountData = useLiveAccountData(props.account.accountID, props.account.testnet)

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
  }, [accountData, props.account])

  return (
    <>
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
    </>
  )
}

storiesOf("Dialogs", module)
  .addDecorator(story => <AccountsProvider>{story()}</AccountsProvider>)
  .add("TxConfirmationDrawer without password", () => (
    <AccountsContext.Consumer>
      {({ accounts }) =>
        accounts[0] ? (
          <DialogContainer account={accounts[0]}>
            {({ open, onClose, transaction }) => (
              <TransactionReviewDialog
                account={accounts[0]}
                open={open}
                onClose={onClose}
                onSubmitTransaction={() => undefined}
                showSubmissionProgress={false}
                transaction={transaction}
              />
            )}
          </DialogContainer>
        ) : null
      }
    </AccountsContext.Consumer>
  ))
  .add("TxConfirmationDrawer with password", () => (
    <AccountsContext.Consumer>
      {({ accounts }) =>
        accounts[1] ? (
          <DialogContainer account={accounts[1]}>
            {({ open, onClose, transaction }) => (
              <TransactionReviewDialog
                account={accounts[1]}
                open={open}
                onClose={onClose}
                onSubmitTransaction={() => undefined}
                showSubmissionProgress={false}
                transaction={transaction}
              />
            )}
          </DialogContainer>
        ) : null
      }
    </AccountsContext.Consumer>
  ))
