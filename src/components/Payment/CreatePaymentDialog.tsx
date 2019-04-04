import React from "react"
import { Asset, Horizon, Memo, Server, Transaction } from "stellar-sdk"
import Dialog from "@material-ui/core/Dialog"
import Slide from "@material-ui/core/Slide"
import { Account } from "../../context/accounts"
import { trackError } from "../../context/notifications"
import { useAccountData, ObservedAccountData } from "../../hooks"
import { createPaymentOperation, createTransaction } from "../../lib/transaction"
import AccountBalances from "../Account/AccountBalances"
import AccountBalancesContainer from "../Account/AccountBalancesContainer"
import TestnetBadge from "../Dialog/TestnetBadge"
import { Box } from "../Layout/Box"
import MainTitle from "../MainTitle"
import TransactionSender from "../TransactionSender"
import CreatePaymentForm, { PaymentCreationValues } from "./CreatePaymentForm"

function getAssetsFromBalances(balances: Horizon.BalanceLine[]) {
  return balances.map(
    balance =>
      balance.asset_type === "native"
        ? Asset.native()
        : new Asset(
            (balance as Horizon.BalanceLineAsset).asset_code,
            (balance as Horizon.BalanceLineAsset).asset_issuer
          )
  )
}

function createMemo(formValues: PaymentCreationValues) {
  switch (formValues.memoType) {
    case "id":
      return Memo.id(formValues.memoValue)
    case "text":
      return Memo.text(formValues.memoValue)
    default:
      return Memo.none()
  }
}

const Transition = (props: any) => <Slide {...props} direction="up" />

interface Props {
  account: Account
  accountData: ObservedAccountData
  horizon: Server
  open: boolean
  onClose: () => void
  sendTransaction: (transaction: Transaction) => void
}

function CreatePaymentDialog(props: Props) {
  const [txCreationPending, setTxCreationPending] = React.useState(false)
  const trustedAssets = getAssetsFromBalances(props.accountData.balances) || [Asset.native()]

  const handleSubmit = async (formValues: PaymentCreationValues) => {
    try {
      setTxCreationPending(true)
      const asset = trustedAssets.find(trustedAsset => trustedAsset.code === formValues.asset)

      const payment = await createPaymentOperation({
        asset: asset || Asset.native(),
        amount: formValues.amount,
        destination: formValues.destination,
        horizon: props.horizon
      })
      const tx = await createTransaction([payment], {
        accountData: props.accountData,
        memo: createMemo(formValues),
        horizon: props.horizon,
        walletAccount: props.account
      })
      props.sendTransaction(tx)
    } catch (error) {
      trackError(error)
    } finally {
      setTxCreationPending(false)
    }
  }

  return (
    <Dialog open={props.open} fullScreen onClose={props.onClose} TransitionComponent={Transition}>
      <Box width="100%" maxWidth={900} padding="24px 36px" margin="0 auto">
        <MainTitle
          title={<span>Send funds {props.account.testnet ? <TestnetBadge style={{ marginLeft: 8 }} /> : null}</span>}
          onBack={props.onClose}
        />
        <AccountBalancesContainer>
          <AccountBalances publicKey={props.account.publicKey} testnet={props.account.testnet} />
        </AccountBalancesContainer>
        <Box margin="24px 0 0">
          <CreatePaymentForm
            accountData={props.accountData}
            onSubmit={handleSubmit}
            trustedAssets={trustedAssets}
            txCreationPending={txCreationPending}
          />
        </Box>
      </Box>
    </Dialog>
  )
}

function ConnectedCreatePaymentDialog(props: Pick<Props, "account" | "open" | "onClose">) {
  const accountData = useAccountData(props.account.publicKey, props.account.testnet)
  const closeAfterTimeout = () => {
    // Close automatically a second after successful submission
    setTimeout(() => props.onClose(), 1000)
  }
  return (
    <TransactionSender account={props.account} onSubmissionCompleted={closeAfterTimeout}>
      {({ horizon, sendTransaction }) => (
        <CreatePaymentDialog {...props} accountData={accountData} horizon={horizon} sendTransaction={sendTransaction} />
      )}
    </TransactionSender>
  )
}

export default ConnectedCreatePaymentDialog
