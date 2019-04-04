import React from "react"
import { Asset, Horizon, Memo, MemoType, Server, Transaction } from "stellar-sdk"
import Dialog from "@material-ui/core/Dialog"
import Slide from "@material-ui/core/Slide"
import Typography from "@material-ui/core/Typography"
import { Account } from "../../context/accounts"
import { trackError } from "../../context/notifications"
import { useAccountData, ObservedAccountData } from "../../hooks"
import { lookupFederationRecord } from "../../lib/stellar-address"
import { createPaymentOperation, createTransaction } from "../../lib/transaction"
import AccountBalances from "../Account/AccountBalances"
import TestnetBadge from "../Dialog/TestnetBadge"
import { Box } from "../Layout/Box"
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
      const federationRecord =
        formValues.destination.indexOf("*") > -1 ? await lookupFederationRecord(formValues.destination) : null
      const destination = federationRecord ? federationRecord.account_id : formValues.destination

      const userMemo = createMemo(formValues)
      const federationMemo =
        federationRecord && federationRecord.memo && federationRecord.memo_type
          ? new Memo(federationRecord.memo_type as MemoType, federationRecord.memo)
          : Memo.none()

      if (userMemo.type !== "none" && federationMemo.type !== "none") {
        throw new Error(
          `Cannot set a custom memo. Federation record of ${formValues.destination} already specifies memo.`
        )
      }

      const payment = await createPaymentOperation({
        asset: asset || Asset.native(),
        amount: formValues.amount,
        destination,
        horizon: props.horizon
      })
      const tx = await createTransaction([payment], {
        accountData: props.accountData,
        memo: federationMemo.type !== "none" ? federationMemo : userMemo,
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
        <Typography variant="h5" component="h2" style={{ marginTop: 8, marginBottom: 8 }}>
          Send funds {props.account.testnet ? <TestnetBadge style={{ marginLeft: 8 }} /> : null}
        </Typography>
        <Box margin="0 0 18px">
          <AccountBalances publicKey={props.account.publicKey} testnet={props.account.testnet} />
        </Box>
        <CreatePaymentForm
          accountData={props.accountData}
          onCancel={props.onClose}
          onSubmit={handleSubmit}
          trustedAssets={trustedAssets}
          txCreationPending={txCreationPending}
        />
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
