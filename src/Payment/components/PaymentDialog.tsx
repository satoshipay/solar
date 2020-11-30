import React from "react"
import { useTranslation } from "react-i18next"
import { Asset, MemoType, Server, Transaction } from "stellar-sdk"
import { Account } from "~App/contexts/accounts"
import { trackError } from "~App/contexts/notifications"
import { useLiveAccountData, useLiveAccountOffers } from "~Generic/hooks/stellar-subscriptions"
import { useDialogActions, useRouter } from "~Generic/hooks/userinterface"
import { AccountData } from "~Generic/lib/account"
import { getAssetsFromBalances, parseAssetID } from "~Generic/lib/stellar"
import DialogBody from "~Layout/components/DialogBody"
import TestnetBadge from "~Generic/components/TestnetBadge"
import { Box } from "~Layout/components/Box"
import ScrollableBalances from "~Generic/components/ScrollableBalances"
import MainTitle from "~Generic/components/MainTitle"
import TransactionSender from "~Transaction/components/TransactionSender"
import PaymentForm from "./PaymentForm"

export interface PaymentQueryParams {
  amount: string | null
  asset: Asset | null
  destination: string | null
  memo: string | null
  memoType: MemoType | null
}

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

  const router = useRouter()

  const query = React.useMemo(() => new URLSearchParams(router.location.search), [router.location.search])
  const [queryParams, setQueryParams] = React.useState<PaymentQueryParams>({
    amount: null,
    asset: null,
    destination: null,
    memo: null,
    memoType: null
  })

  React.useEffect(() => {
    const amount = query.get("amount")
    const assetString = query.get("asset")
    const asset = assetString ? parseAssetID(assetString) : null
    const destination = query.get("destination")
    const memo = query.get("memo")
    const memoType = query.get("memoType") ? (query.get("memoType") as MemoType) : null

    setQueryParams({ amount, asset, destination, memo, memoType })
  }, [query])

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
        preselectedParams={queryParams}
        testnet={props.account.testnet}
        trustedAssets={trustedAssets}
        txCreationPending={txCreationPending}
      />
    </DialogBody>
  )
}

function ConnectedPaymentDialog(props: Pick<Props, "account" | "onClose">) {
  const accountData = useLiveAccountData(props.account.publicKey, props.account.testnet)
  const { offers: openOrders } = useLiveAccountOffers(props.account.publicKey, props.account.testnet)

  return (
    <TransactionSender account={props.account} onSubmissionCompleted={props.onClose}>
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
