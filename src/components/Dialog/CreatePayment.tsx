import React from "react"
import { AccountRecord, Asset, Memo, Server, Transaction } from "stellar-sdk"
import { createPaymentOperation, createTransaction } from "../../lib/transaction"
import { Account } from "../../stores/accounts"
import { addError } from "../../stores/notifications"
import { PaymentCreationValues } from "../Form/CreatePayment"
import { AccountData } from "../Subscribers"
import TransactionSender from "../TransactionSender"
import PaymentFormDrawer from "./PaymentForm"

type Omit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>

function getAssetsFromBalances(balances: AccountRecord["balances"]) {
  return balances.map(
    balance => (balance.asset_type === "native" ? Asset.native() : new Asset(balance.asset_code, balance.asset_issuer))
  )
}

interface Props {
  account: Account
  horizon: Server
  open: boolean
  onClose: () => void
  sendTransaction: (transaction: Transaction) => void
  trustedAssets: Asset[]
}

interface State {
  submissionFailed: boolean
  submissionPromise: Promise<any> | null
  transaction: Transaction | null
}

class CreatePaymentDialog extends React.Component<Props, State> {
  createMemo = (formValues: PaymentCreationValues) => {
    switch (formValues.memoType) {
      case "id":
        return Memo.id(formValues.memoValue)
      case "text":
        return Memo.text(formValues.memoValue)
      default:
        return Memo.none()
    }
  }

  createTransaction = async (formValues: PaymentCreationValues) => {
    try {
      const asset = this.props.trustedAssets.find(trustedAsset => trustedAsset.code === formValues.asset)

      const payment = await createPaymentOperation({
        asset: asset || Asset.native(),
        amount: formValues.amount,
        destination: formValues.destination,
        horizon: this.props.horizon
      })
      const tx = await createTransaction([payment], {
        memo: this.createMemo(formValues),
        horizon: this.props.horizon,
        walletAccount: this.props.account
      })
      this.props.sendTransaction(tx)
    } catch (error) {
      addError(error)
    }
  }

  render() {
    return (
      <PaymentFormDrawer
        open={this.props.open}
        account={this.props.account}
        onClose={this.props.onClose}
        onSubmit={this.createTransaction}
        trustedAssets={this.props.trustedAssets}
      />
    )
  }
}

const ConnectedCreatePaymentDialog = (props: Omit<Props, "horizon" | "sendTransaction">) => {
  const closeAfterTimeout = () => {
    // Close automatically a second after successful submission
    setTimeout(() => props.onClose(), 1000)
  }
  return (
    <TransactionSender account={props.account} onSubmissionCompleted={closeAfterTimeout}>
      {({ horizon, sendTransaction }) => (
        <AccountData publicKey={props.account.publicKey} testnet={props.account.testnet}>
          {accountData => (
            <CreatePaymentDialog
              {...props}
              horizon={horizon}
              sendTransaction={sendTransaction}
              trustedAssets={getAssetsFromBalances(accountData.balances)}
            />
          )}
        </AccountData>
      )}
    </TransactionSender>
  )
}

export default ConnectedCreatePaymentDialog
