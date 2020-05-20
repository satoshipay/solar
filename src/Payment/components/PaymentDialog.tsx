import React from "react"
import { useTranslation } from "react-i18next"
import { Asset, Server, Transaction } from "stellar-sdk"
import { Account } from "~App/contexts/accounts"
import { trackError } from "~App/contexts/notifications"
import { useLiveAccountData, useLiveAccountOffers } from "~Generic/hooks/stellar-subscriptions"
import { useDialogActions } from "~Generic/hooks/userinterface"
import { AccountData } from "~Generic/lib/account"
import { getAssetsFromBalances } from "~Generic/lib/stellar"
import DialogBody from "~Layout/components/DialogBody"
import TestnetBadge from "~Generic/components/TestnetBadge"
import { Box } from "~Layout/components/Box"
import ScrollableBalances from "~Generic/components/ScrollableBalances"
import MainTitle from "~Generic/components/MainTitle"
import TransactionSender from "~Transaction/components/TransactionSender"
import PaymentForm from "./PaymentForm"

interface Props {
  account: Account
  accountData: AccountData
  horizon: Server
  onClose: () => void
  openOrdersCount: number
  sendTransaction: (transaction: Transaction) => Promise<any>
}

function PaymentDialog(props: Props) {
  const { sendTransaction } = props
  const dialogActionsRef = useDialogActions()
  const { t } = useTranslation()
  const [txCreationPending, setTxCreationPending] = React.useState(false)

  const handleSubmit = React.useCallback(
    async (createTx: (horizon: Server, account: Account) => Promise<Transaction>) => {
      try {
        setTxCreationPending(true)
        const tx = await createTx(props.horizon, props.account)
        setTxCreationPending(false)
        await sendTransaction(tx)
      } catch (error) {
        trackError(error)
      } finally {
        setTxCreationPending(false)
      }
    },
    [props.account, props.horizon, sendTransaction]
  )

  const trustedAssets = React.useMemo(() => getAssetsFromBalances(props.accountData.balances) || [Asset.native()], [
    props.accountData.balances
  ])

  return (
    <DialogBody
      top={
        <>
          <MainTitle
            title={
              <span>
                {t("payment.title.send")}
                {props.account.testnet ? <TestnetBadge style={{ marginLeft: 8 }} /> : null}
              </span>
            }
            onBack={props.onClose}
          />
          <ScrollableBalances account={props.account} compact />
        </>
      }
      actions={dialogActionsRef}
    >
      <Box margin="24px 0 0">{null}</Box>
      <PaymentForm
        accountData={props.accountData}
        actionsRef={dialogActionsRef}
        onCancel={props.onClose}
        onSubmit={handleSubmit}
        openOrdersCount={props.openOrdersCount}
        testnet={props.account.testnet}
        trustedAssets={trustedAssets}
        txCreationPending={txCreationPending}
      />
    </DialogBody>
  )
}

function ConnectedPaymentDialog(props: Pick<Props, "account" | "onClose">) {
  const accountData = useLiveAccountData(props.account.accountID, props.account.testnet)
  const openOrders = useLiveAccountOffers(props.account.accountID, props.account.testnet)

  const closeAfterTimeout = () => {
    // Close automatically a second after successful submission
    setTimeout(() => props.onClose(), 1000)
  }
  return (
    <TransactionSender account={props.account} onSubmissionCompleted={closeAfterTimeout}>
      {({ horizon, sendTransaction }) => (
        <PaymentDialog
          {...props}
          accountData={accountData}
          horizon={horizon}
          openOrdersCount={openOrders.length}
          sendTransaction={sendTransaction}
        />
      )}
    </TransactionSender>
  )
}

export default ConnectedPaymentDialog
