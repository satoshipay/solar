import React from "react"
import { Asset, Server, Transaction } from "stellar-sdk"
import { Account } from "../../context/accounts"
import { trackError } from "../../context/notifications"
import { useAccountData, useIsMobile, ObservedAccountData } from "../../hooks"
import { getAssetsFromBalances } from "../../lib/stellar"
import AccountBalances from "../Account/AccountBalances"
import AccountBalancesContainer from "../Account/AccountBalancesContainer"
import TestnetBadge from "../Dialog/TestnetBadge"
import { Box } from "../Layout/Box"
import MainTitle from "../MainTitle"
import TransactionSender from "../TransactionSender"
import CreatePaymentForm from "./CreatePaymentForm"

interface Props {
  account: Account
  accountData: ObservedAccountData
  horizon: Server
  onClose: () => void
  sendTransaction: (account: Account, transaction: Transaction) => Promise<any>
}

function CreatePaymentDialog(props: Props) {
  const [txCreationPending, setTxCreationPending] = React.useState(false)
  const isSmallScreen = useIsMobile()

  const handleSubmit = React.useCallback(
    async (createTx: (horizon: Server, account: Account) => Promise<Transaction>) => {
      try {
        setTxCreationPending(true)
        const tx = await createTx(props.horizon, props.account)
        await props.sendTransaction(props.account, tx)
      } catch (error) {
        trackError(error)
      } finally {
        setTxCreationPending(false)
      }
    },
    [props.account, props.horizon]
  )

  const trustedAssets = React.useMemo(() => getAssetsFromBalances(props.accountData.balances) || [Asset.native()], [
    props.accountData.balances
  ])

  return (
    <Box width="100%" maxHeight="100%" maxWidth={900} padding={isSmallScreen ? "24px" : " 24px 32px"} margin="0 auto">
      <MainTitle
        title={<span>Send funds {props.account.testnet ? <TestnetBadge style={{ marginLeft: 8 }} /> : null}</span>}
        onBack={props.onClose}
      />
      <AccountBalancesContainer>
        <AccountBalances publicKey={props.account.publicKey} testnet={props.account.testnet} />
      </AccountBalancesContainer>
      <Box margin="24px 0 0">{null}</Box>
      <CreatePaymentForm
        accountData={props.accountData}
        onCancel={props.onClose}
        onSubmit={handleSubmit}
        trustedAssets={trustedAssets}
        txCreationPending={txCreationPending}
      />
    </Box>
  )
}

function ConnectedCreatePaymentDialog(props: Pick<Props, "account" | "onClose">) {
  const accountData = useAccountData(props.account.publicKey, props.account.testnet)
  const closeAfterTimeout = () => {
    // Close automatically a second after successful submission
    setTimeout(() => props.onClose(), 1000)
  }
  return (
    <TransactionSender testnet={props.account.testnet} onSubmissionCompleted={closeAfterTimeout}>
      {({ horizon, sendTransaction }) => (
        <CreatePaymentDialog {...props} accountData={accountData} horizon={horizon} sendTransaction={sendTransaction} />
      )}
    </TransactionSender>
  )
}

export default ConnectedCreatePaymentDialog
