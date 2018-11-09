import React from "react"
import { AccountRecord, Asset, Memo, Server, Transaction } from "stellar-sdk"
import Dialog from "@material-ui/core/Dialog"
import Slide, { SlideProps } from "@material-ui/core/Slide"
import Typography from "@material-ui/core/Typography"
import { Account } from "../../context/accounts"
import { addError } from "../../context/notifications"
import { createPaymentOperation, createTransaction } from "../../lib/transaction"
import CreatePaymentForm, { PaymentCreationValues } from "../Form/CreatePayment"
import { Box } from "../Layout/Box"
import { AccountData } from "../Subscribers"
import TransactionSender from "../TransactionSender"
import TestnetBadge from "./TestnetBadge"

type Omit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>

function getAssetsFromBalances(balances: AccountRecord["balances"]) {
  return balances.map(
    balance => (balance.asset_type === "native" ? Asset.native() : new Asset(balance.asset_code, balance.asset_issuer))
  )
}

const Transition = (props: SlideProps) => <Slide {...props} direction="up" />

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
  transaction: Transaction | null
  txCreationPending: boolean
}

class CreatePaymentDialog extends React.Component<Props, State> {
  state: State = {
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
      <Dialog open={this.props.open} fullScreen onClose={this.props.onClose} TransitionComponent={Transition}>
        <Box width="100%" maxWidth={900} padding="24px 0 0" margin="0 auto">
          <Typography variant="headline" component="h2" style={{ marginTop: 8, marginBottom: 40 }}>
            Send funds {this.props.account.testnet ? <TestnetBadge style={{ marginLeft: 8 }} /> : null}
          </Typography>
          <CreatePaymentForm
            balances={this.props.balances}
            onCancel={this.props.onClose}
            onSubmit={this.createTransaction}
            trustedAssets={trustedAssets}
            txCreationPending={this.state.txCreationPending}
          />
        </Box>
      </Dialog>
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
