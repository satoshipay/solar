import React from "react"
import { AccountRecord, Asset, Memo, Server, Transaction } from "stellar-sdk"
import Drawer from "@material-ui/core/Drawer"
import Card from "@material-ui/core/Card"
import CardContent from "@material-ui/core/CardContent"
import Typography from "@material-ui/core/Typography"
import { createPaymentOperation, createTransaction } from "../../lib/transaction"
import { Account } from "../../stores/accounts"
import { addError } from "../../stores/notifications"
import CreatePaymentForm, { PaymentCreationValues } from "../Form/CreatePayment"
import { AccountData } from "../Subscribers"
import TransactionSender from "../TransactionSender"
import CloseButton from "./CloseButton"
import TestnetBadge from "./TestnetBadge"

type Omit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>

function getAssetsFromBalances(balances: AccountRecord["balances"]) {
  return balances.map(
    balance => (balance.asset_type === "native" ? Asset.native() : new Asset(balance.asset_code, balance.asset_issuer))
  )
}

interface Props {
  account: Account
  balances: AccountRecord["balances"]
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
  txCreationPending: boolean
}

class CreatePaymentDialog extends React.Component<Props, State> {
  state: State = {
    submissionFailed: false,
    submissionPromise: null,
    transaction: null,
    txCreationPending: false
  }

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
      this.setState({ txCreationPending: true })
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
    } finally {
      this.setState({ txCreationPending: false })
    }
  }

  render() {
    const trustedAssets = this.props.trustedAssets || [Asset.native()]
    return (
      <Drawer open={this.props.open} anchor="right" onClose={this.props.onClose}>
        <Card
          style={{
            position: "relative",
            height: "100%",
            padding: "0 12px",
            width: "90vw",
            maxWidth: "700px"
          }}
        >
          <CloseButton onClick={this.props.onClose} />
          <CardContent style={{ paddingTop: 24 }}>
            <Typography variant="headline" component="h2" style={{ marginTop: 8 }}>
              Send funds {this.props.account.testnet ? <TestnetBadge style={{ marginLeft: 8 }} /> : null}
            </Typography>
            <div style={{ marginTop: 40 }}>
              <CreatePaymentForm
                balances={this.props.balances}
                onSubmit={this.createTransaction}
                trustedAssets={trustedAssets}
                txCreationPending={this.state.txCreationPending}
              />
            </div>
          </CardContent>
        </Card>
      </Drawer>
    )
  }
}

const ConnectedCreatePaymentDialog = (
  props: Omit<Props, "balances" | "horizon" | "sendTransaction" | "trustedAssets">
) => {
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
              balances={accountData.balances}
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
