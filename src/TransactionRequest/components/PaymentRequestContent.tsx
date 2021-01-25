import Box from "@material-ui/core/Box"
import Typography from "@material-ui/core/Typography"
import { PayStellarUri } from "@stellarguard/stellar-uri"
import React from "react"
import { useTranslation } from "react-i18next"
import { Asset, Server, Transaction } from "stellar-sdk"
import AccountSelectionList from "~Account/components/AccountSelectionList"
import { Account } from "~App/contexts/accounts"
import { trackError } from "~App/contexts/notifications"
import ViewLoading from "~Generic/components/ViewLoading"
import { useLiveAccountDataSet, useLiveAccountOffers } from "~Generic/hooks/stellar-subscriptions"
import { RefStateObject } from "~Generic/hooks/userinterface"
import { AccountData } from "~Generic/lib/account"
import { getAssetsFromBalances } from "~Generic/lib/stellar"
import { PaymentParams } from "~Payment/components/PaymentForm"
import PaymentForm from "~Payment/components/PaymentForm"
import { SendTransaction } from "../../Transaction/components/TransactionSender"

interface ConnectedPaymentFormProps {
  accountData: AccountData
  actionsRef: RefStateObject
  horizon: Server
  onClose: () => void
  preselectedParams: PaymentParams
  selectedAccount: Account
  sendTransaction: SendTransaction
}

function ConnectedPaymentForm(props: ConnectedPaymentFormProps) {
  const { sendTransaction } = props
  const testnet = props.selectedAccount.testnet

  const [txCreationPending, setTxCreationPending] = React.useState(false)
  const { offers: openOrders } = useLiveAccountOffers(props.selectedAccount.publicKey, testnet)
  const trustedAssets = React.useMemo(() => getAssetsFromBalances(props.accountData.balances) || [Asset.native()], [
    props.accountData.balances
  ])

  const handleSubmit = React.useCallback(
    async (createTx: (horizon: Server, account: Account) => Promise<Transaction>) => {
      try {
        setTxCreationPending(true)
        const tx = await createTx(props.horizon, props.selectedAccount)
        setTxCreationPending(false)
        await sendTransaction(tx)
      } catch (error) {
        trackError(error)
      } finally {
        setTxCreationPending(false)
      }
    },
    [props.selectedAccount, props.horizon, sendTransaction]
  )

  return (
    <PaymentForm
      accountData={props.accountData}
      actionsRef={props.actionsRef}
      onCancel={props.onClose}
      onSubmit={handleSubmit}
      openOrdersCount={openOrders.length}
      preselectedParams={props.preselectedParams}
      testnet={testnet}
      trustedAssets={trustedAssets}
      txCreationPending={txCreationPending}
    />
  )
}

interface PaymentRequestContentProps {
  accounts: Account[]
  actionsRef: RefStateObject
  horizon: Server
  onAccountChange: (account: Account) => void
  onClose: () => void
  payStellarUri: PayStellarUri
  selectedAccount: Account | null
  sendTransaction: SendTransaction
}

function PaymentRequestContent(props: PaymentRequestContentProps) {
  const {
    amount,
    assetCode,
    assetIssuer,
    destination,
    memo,
    memoType,
    msg,
    isTestNetwork: testnet
  } = props.payStellarUri

  const { t } = useTranslation()

  const accountDataSet = useLiveAccountDataSet(
    props.accounts.map(acc => acc.publicKey),
    testnet
  )
  const accountData = accountDataSet.find(acc => acc.account_id === props.selectedAccount?.publicKey)
  const asset = React.useMemo(() => (assetCode && assetIssuer ? new Asset(assetCode, assetIssuer) : Asset.native()), [
    assetCode,
    assetIssuer
  ])
  const paymentParams = React.useMemo(() => {
    return {
      amount,
      asset,
      destination,
      memo,
      memoType
    }
  }, [amount, asset, destination, memo, memoType])

  return (
    <Box>
      <React.Suspense fallback={<ViewLoading height={200} />}>
        {props.selectedAccount && accountData && (
          <>
            {msg && (
              <Typography style={{ marginTop: 8 }}>
                <b>{t("transaction-request.payment.uri-content.message")}:</b> {msg}
              </Typography>
            )}
            <ConnectedPaymentForm
              accountData={accountData}
              actionsRef={props.actionsRef}
              horizon={props.horizon}
              onClose={props.onClose}
              selectedAccount={props.selectedAccount}
              sendTransaction={props.sendTransaction}
              preselectedParams={paymentParams}
            />
          </>
        )}
      </React.Suspense>
      <Typography component="h6" variant="h6" style={{ marginTop: 8 }}>
        {t("transaction-request.payment.account-selector")}
      </Typography>
      {props.accounts.length > 0 ? (
        <AccountSelectionList
          accounts={props.accounts}
          onChange={props.onAccountChange}
          selectedAccount={props.selectedAccount || undefined}
          testnet={testnet}
        />
      ) : (
        <Typography align="center" color="error" variant="h6" style={{ paddingTop: 16 }}>
          {asset.code === "XLM"
            ? t("transaction-request.payment.error.no-activated-accounts")
            : t("transaction-request.payment.error.no-accounts-with-trustline")}
        </Typography>
      )}
    </Box>
  )
}

export default PaymentRequestContent
