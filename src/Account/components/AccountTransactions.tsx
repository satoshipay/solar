import React from "react"
import { useTranslation } from "react-i18next"
import DoneAllIcon from "@material-ui/icons/DoneAll"
import CreditCardIcon from "@material-ui/icons/CreditCard"
import UpdateIcon from "@material-ui/icons/Update"
import { Account } from "~App/contexts/accounts"
import { SettingsContext } from "~App/contexts/settings"
import { SignatureDelegationContext } from "~App/contexts/signatureDelegation"
import { hasSigned } from "~Generic/lib/transaction"
import { useHorizonURL } from "~Generic/hooks/stellar"
import {
  useLiveRecentTransactions,
  useLiveAccountData,
  useOlderTransactions
} from "~Generic/hooks/stellar-subscriptions"
import { useIsMobile, useRouter } from "~Generic/hooks/userinterface"
import { useLoadingState } from "~Generic/hooks/util"
import * as routes from "../../routes"
import MainSelectionButton from "~Generic/components/MainSelectionButton"
import { VerticalLayout } from "~Layout/components/Box"
import FriendbotButton from "./FriendbotButton"
import OfferList from "./OfferList"
import { InteractiveSignatureRequestList } from "./SignatureRequestList"
import TransactionList from "./TransactionList"

function PendingMultisigTransactions(props: { account: Account }) {
  const { pendingSignatureRequests } = React.useContext(SignatureDelegationContext)

  const cosignIcon = React.useMemo(() => <DoneAllIcon />, [])
  const waitingIcon = React.useMemo(() => <UpdateIcon style={{ opacity: 0.5 }} />, [])

  const pendingRequestsToCosign = React.useMemo(() => {
    return pendingSignatureRequests.filter(
      request =>
        request._embedded.signers.some(signer => signer.account_id === props.account.publicKey) &&
        !hasSigned(request.meta.transaction, props.account.publicKey)
    )
  }, [props.account, pendingSignatureRequests])

  const pendingRequestsWaitingForOthers = React.useMemo(() => {
    return pendingSignatureRequests.filter(
      request =>
        request._embedded.signers.some(signer => signer.account_id === props.account.publicKey) &&
        hasSigned(request.meta.transaction, props.account.publicKey)
    )
  }, [props.account, pendingSignatureRequests])

  return (
    <>
      <InteractiveSignatureRequestList
        account={props.account}
        icon={cosignIcon}
        signatureRequests={pendingRequestsToCosign}
        title="Transactions to co-sign"
      />
      <InteractiveSignatureRequestList
        account={props.account}
        icon={waitingIcon}
        signatureRequests={pendingRequestsWaitingForOthers}
        title="Awaiting additional signatures"
      />
    </>
  )
}

function AccountTransactions(props: { account: Account }) {
  const { account } = props
  const { t } = useTranslation()
  const accountData = useLiveAccountData(account.publicKey, account.testnet)
  const horizonURL = useHorizonURL(account.testnet)
  const isSmallScreen = useIsMobile()
  const [moreTxsLoadingState, handleMoreTxsFetch] = useLoadingState()
  const recentTxs = useLiveRecentTransactions(account.publicKey, account.testnet)
  const fetchMoreTransactions = useOlderTransactions(account.publicKey, account.testnet)
  const router = useRouter()
  const settings = React.useContext(SettingsContext)

  const handleFetchMoreTransactions = React.useCallback(() => handleMoreTxsFetch(fetchMoreTransactions()), [
    fetchMoreTransactions,
    handleMoreTxsFetch
  ])

  const navigateToDeposit = React.useCallback(() => router.history.push(routes.depositAsset(account.id)), [
    account,
    router
  ])

  return (
    <>
      {accountData.balances.length > 0 ? (
        <>
          {settings.multiSignature ? <PendingMultisigTransactions account={account} /> : null}
          <OfferList account={account} title="Open orders" />
          <TransactionList
            account={account}
            background="transparent"
            loadingMoreTransactions={moreTxsLoadingState.type === "pending"}
            olderTransactionsAvailable={recentTxs.olderTransactionsAvailable}
            onFetchMoreTransactions={handleFetchMoreTransactions}
            title={t("account.transaction-list.title")}
            testnet={account.testnet}
            transactions={recentTxs.transactions}
          />
        </>
      ) : (
        <>
          <VerticalLayout
            alignItems="stretch"
            margin="0 auto"
            style={{ padding: isSmallScreen ? "16px 28px" : "32px 28px", width: "fit-content" }}
          >
            {account.testnet ? (
              <FriendbotButton
                horizonURL={horizonURL}
                publicKey={account.publicKey}
                style={{ marginBottom: isSmallScreen ? 16 : 32 }}
              />
            ) : null}
            <MainSelectionButton
              Icon={CreditCardIcon}
              description="Via credit card, bank transfer, etc."
              label="Deposit funds"
              onClick={navigateToDeposit}
            />
          </VerticalLayout>
        </>
      )}
    </>
  )
}

export default React.memo(AccountTransactions)
