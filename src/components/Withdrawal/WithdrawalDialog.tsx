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
import Offramp from "../Withdrawal/Offramp"

interface Props {
  account: Account
  accountData: ObservedAccountData
  horizon: Server
  onClose: () => void
  sendTransaction: (account: Account, transaction: Transaction) => Promise<any>
}

function WithdrawalDialog(props: Props) {
  const isSmallScreen = useIsMobile()

  const handleSubmit = React.useCallback(
    async (createTx: (horizon: Server, account: Account) => Promise<Transaction>) => {
      try {
        const tx = await createTx(props.horizon, props.account)
        await props.sendTransaction(props.account, tx)
      } catch (error) {
        trackError(error)
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
      <Offramp
        account={props.account}
        assets={trustedAssets.filter(asset => !asset.isNative())}
        horizon={props.horizon}
        onCancel={props.onClose}
        onSubmit={handleSubmit}
        testnet={props.account.testnet}
      />
    </Box>
  )
}

function ConnectedWithdrawalDialog(props: Pick<Props, "account" | "onClose">) {
  const accountData = useAccountData(props.account.publicKey, props.account.testnet)
  const closeAfterTimeout = () => {
    // Close automatically a second after successful submission
    setTimeout(() => props.onClose(), 1000)
  }
  return (
    <TransactionSender onSubmissionCompleted={closeAfterTimeout} testnet={props.account.testnet}>
      {({ horizon, sendTransaction }) => (
        <WithdrawalDialog {...props} accountData={accountData} horizon={horizon} sendTransaction={sendTransaction} />
      )}
    </TransactionSender>
  )
}

export default ConnectedWithdrawalDialog
