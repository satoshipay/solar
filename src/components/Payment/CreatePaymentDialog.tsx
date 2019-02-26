import React from "react"
import { Asset, Horizon, Memo, Server, Transaction } from "stellar-sdk"
import Dialog from "@material-ui/core/Dialog"
import Slide from "@material-ui/core/Slide"
import Tab from "@material-ui/core/Tab"
import Tabs from "@material-ui/core/Tabs"
import Typography from "@material-ui/core/Typography"
import { Account } from "../../context/accounts"
import { trackError } from "../../context/notifications"
import { useAccountData } from "../../hooks"
import { createPaymentOperation, createTransaction } from "../../lib/transaction"
import AccountBalances from "../Account/AccountBalances"
import TestnetBadge from "../Dialog/TestnetBadge"
import { Box } from "../Layout/Box"
import TransactionSender from "../TransactionSender"
import CreatePaymentForm, { PaymentCreationValues } from "./CreatePaymentForm"
import AnchorWithdrawalForm from "./AnchorWithdrawalForm"

type ActionMode = "native" | "anchor"

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
  balances: Horizon.BalanceLine[]
  horizon: Server
  open: boolean
  onClose: () => void
  sendTransaction: (transaction: Transaction) => void
  trustedAssets: Asset[]
}

function CreatePaymentDialog(props: Props) {
  const [selectedTab, setSelectedTab] = React.useState<ActionMode>("native")
  const [txCreationPending, setTxCreationPending] = React.useState(false)
  const trustedAssets = props.trustedAssets || [Asset.native()]

  const handleSubmit = async (formValues: PaymentCreationValues) => {
    try {
      setTxCreationPending(true)
      const asset = props.trustedAssets.find(trustedAsset => trustedAsset.code === formValues.asset)

      const payment = await createPaymentOperation({
        asset: asset || Asset.native(),
        amount: formValues.amount,
        destination: formValues.destination,
        horizon: props.horizon
      })
      const tx = await createTransaction([payment], {
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
        <Typography variant="h5" component="h2" style={{ marginTop: 8, marginBottom: 8 }}>
          Send funds {props.account.testnet ? <TestnetBadge style={{ marginLeft: 8 }} /> : null}
        </Typography>
        <Box margin="0 0 18px">
          <AccountBalances publicKey={props.account.publicKey} testnet={props.account.testnet} />
        </Box>
        <Box margin="0 0 18px">
          <Tabs indicatorColor="primary" onChange={(event, value) => setSelectedTab(value)} value={selectedTab}>
            <Tab label="Send payment" value="native" />
            <Tab label="Withdraw asset" value="sep-6" />
          </Tabs>
        </Box>
        {selectedTab === "native" ? (
          <CreatePaymentForm
            balances={props.balances}
            onCancel={props.onClose}
            onSubmit={handleSubmit}
            trustedAssets={trustedAssets}
            txCreationPending={txCreationPending}
          />
        ) : (
          <AnchorWithdrawalForm />
        )}
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
        <CreatePaymentDialog
          {...props}
          balances={accountData.balances}
          horizon={horizon}
          sendTransaction={sendTransaction}
          trustedAssets={getAssetsFromBalances(accountData.balances)}
        />
      )}
    </TransactionSender>
  )
}

export default ConnectedCreatePaymentDialog
