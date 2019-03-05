import React from "react"
import { Asset, Horizon, Server, Transaction } from "stellar-sdk"
import Dialog from "@material-ui/core/Dialog"
import Slide from "@material-ui/core/Slide"
import Tab from "@material-ui/core/Tab"
import Tabs from "@material-ui/core/Tabs"
import Typography from "@material-ui/core/Typography"
import SendIcon from "@material-ui/icons/Send"
import { Account } from "../../context/accounts"
import { trackError } from "../../context/notifications"
import { useAccountData, ObservedAccountData } from "../../hooks"
import AccountBalances from "../Account/AccountBalances"
import { ActionButton, DialogActionsBox } from "../Dialog/Generic"
import TestnetBadge from "../Dialog/TestnetBadge"
import { Box } from "../Layout/Box"
import TransactionSender from "../TransactionSender"
import CreatePaymentForm from "./CreatePaymentForm"
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
  const [selectedTab, setSelectedTab] = React.useState<ActionMode>("native")
  const [txCreationPending, setTxCreationPending] = React.useState(false)
  const trustedAssets = getAssetsFromBalances(props.accountData.balances) || [Asset.native()]

  const handleSubmit = async (createTx: (horizon: Server, account: Account) => Promise<Transaction>) => {
    try {
      setTxCreationPending(true)
      const tx = await createTx(props.horizon, props.account)
      props.sendTransaction(tx)
    } catch (error) {
      trackError(error)
    } finally {
      setTxCreationPending(false)
    }
  }

  const Actions = React.useCallback(
    (actionProps: { disabled?: boolean; onSubmit: () => void }) => (
      <DialogActionsBox spacing="large" style={{ marginTop: 64 }}>
        <ActionButton onClick={props.onClose}>Cancel</ActionButton>
        <ActionButton
          disabled={actionProps.disabled}
          icon={<SendIcon style={{ fontSize: 16 }} />}
          loading={txCreationPending}
          onClick={actionProps.onSubmit}
          type="submit"
        >
          Send
        </ActionButton>
      </DialogActionsBox>
    ),
    [props.onClose, txCreationPending]
  )

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
          <Tabs
            indicatorColor="primary"
            onChange={(event, value) => setSelectedTab(value)}
            value={selectedTab}
            variant="fullWidth"
          >
            <Tab label="Send payment" value="native" />
            <Tab label="Withdraw" value="sep-6" />
          </Tabs>
        </Box>
        {selectedTab === "native" ? (
          <CreatePaymentForm
            Actions={Actions}
            accountData={props.accountData}
            onSubmit={handleSubmit}
            trustedAssets={trustedAssets}
            txCreationPending={txCreationPending}
          />
        ) : (
          <AnchorWithdrawalForm
            Actions={Actions}
            account={props.account}
            assets={trustedAssets.filter(asset => !asset.isNative())}
            horizon={props.horizon}
            onCancel={props.onClose}
            onSubmit={handleSubmit}
            testnet={props.account.testnet}
          />
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
        <CreatePaymentDialog {...props} accountData={accountData} horizon={horizon} sendTransaction={sendTransaction} />
      )}
    </TransactionSender>
  )
}

export default ConnectedCreatePaymentDialog
