import React from "react"
import { useTranslation } from "react-i18next"
import Dialog from "@material-ui/core/Dialog"
import AccountActions from "../components/Account/AccountActions"
import AccountCreationActions from "../components/Account/AccountCreationActions"
import AccountHeaderCard, { AccountCreation } from "../components/Account/AccountHeaderCard"
import TransactionListPlaceholder from "../components/Account/TransactionListPlaceholder"
import InlineLoader from "../components/InlineLoader"
import { VerticalLayout } from "../components/Layout/Box"
import { Section } from "../components/Layout/Page"
import ScrollableBalances from "../components/Lazy/ScrollableBalances"
import withFallback from "../components/Lazy/withFallback"
import PaymentDialog from "../components/Payment/PaymentDialog"
import ReceivePaymentDialog from "../components/Payment/ReceivePaymentDialog"
import ViewLoading from "../components/ViewLoading"
import { Account, AccountsContext } from "../context/accounts"
import { trackError } from "../context/notifications"
import { useIsMobile, useRouter } from "../hooks/userinterface"
import { getLastArgumentFromURL } from "../lib/url"
import { matchesRoute } from "../lib/routes"
import * as routes from "../routes"
import { FullscreenDialogTransition } from "../theme"

const modules = {
  AssetDetailsDialog: import("../components/AccountAssets/AssetDetailsDialog"),
  BalanceDetailsDialog: import("../components/AccountAssets/BalanceDetailsDialog"),
  TradeAssetDialog: import("../components/Trading/TradingDialog"),
  TransferDialog: import("../components/TransferService/ConnectedTransferDialog")
}

const AccountCreationOptions = withFallback(
  React.lazy(() => import("../components/Account/AccountCreationOptions")),
  <TransactionListPlaceholder />
)
const AccountSettings = withFallback(
  React.lazy(() => import("../components/AccountSettings/AccountSettings")),
  <TransactionListPlaceholder />
)
const AccountTransactions = withFallback(
  React.lazy(() => import("../components/Account/AccountTransactions")),
  <TransactionListPlaceholder />
)

const AssetDetailsDialog = withFallback(
  React.lazy(() => modules.AssetDetailsDialog),
  <ViewLoading />
)
const BalanceDetailsDialog = withFallback(
  React.lazy(() => modules.BalanceDetailsDialog),
  <ViewLoading />
)
const TradeAssetDialog = withFallback(
  React.lazy(() => modules.TradeAssetDialog),
  <ViewLoading />
)

// The TransferDialog has it's own lazy-loading stage, but a parcel bundler bug requires us
// to lazy-load that lazy-loading stage as well…
const TransferDialog = withFallback(
  React.lazy(() => modules.TransferDialog),
  <ViewLoading />
)

function useNewAccountName() {
  const { t } = useTranslation()

  return function getNewAccountName(accounts: Account[], testnet?: boolean) {
    const baseName = testnet ? t("create-account.base-name.testnet") : t("create-account.base-name.mainnet")
    const deriveName = (idx: number) => (idx === 0 ? baseName : `${baseName} ${idx + 1}`)

    let index = 0

    // Find an account name that is not in use yet
    while (accounts.some(account => account.name === deriveName(index))) {
      index++
    }

    return deriveName(index)
  }
}

interface AccountPageContentProps {
  account: Account | undefined
}

const AccountPageContent = React.memo(function AccountPageContent(props: AccountPageContentProps) {
  const isSmallScreen = useIsMobile()
  const router = useRouter()
  const { accounts, renameAccount } = React.useContext(AccountsContext)
  const getNewAccountName = useNewAccountName()

  const showAccountCreation =
    matchesRoute(router.location.pathname, routes.createAccount(true), false) ||
    matchesRoute(router.location.pathname, routes.createAccount(false), false)
  const showAccountSettings = matchesRoute(router.location.pathname, routes.accountSettings("*"), false)
  const showAssetDetails =
    matchesRoute(router.location.pathname, routes.assetDetails("*", "*")) &&
    !matchesRoute(router.location.pathname, routes.manageAccountAssets("*"))
  const showAssetTrading = matchesRoute(router.location.pathname, routes.tradeAsset("*"))
  const showBalanceDetails = matchesRoute(router.location.pathname, routes.balanceDetails("*"))
  const showCreatePayment = matchesRoute(router.location.pathname, routes.createPayment("*"))
  const showDeposit = matchesRoute(router.location.pathname, routes.depositAsset("*"))
  const showReceivePayment = matchesRoute(router.location.pathname, routes.receivePayment("*"))
  const showWithdrawal = matchesRoute(router.location.pathname, routes.withdrawAsset("*"))

  const showSendReceiveButtons = !matchesRoute(router.location.pathname, routes.accountSettings("*"), false)

  const [accountCreation, setAccountCreation] = React.useState<AccountCreation>(() => ({
    multisig: false,
    name: getNewAccountName(accounts, matchesRoute(router.location.pathname, routes.createAccount(true), false)),
    requiresPassword: false, // FIXME
    testnet: matchesRoute(router.location.pathname, routes.createAccount(true), false)
  }))

  const headerHeight = showAccountCreation
    ? isSmallScreen
      ? 128
      : 120
    : isSmallScreen
    ? 188
    : showSendReceiveButtons
    ? 272
    : 184

  const navigateTo = React.useMemo(() => {
    const accountID = props.account?.id
    return {
      accountSettings: accountID ? () => router.history.push(routes.accountSettings(accountID)) : undefined,
      addAssets: accountID ? () => router.history.push(routes.manageAccountAssets(accountID)) : undefined,
      deposit: accountID ? () => router.history.push(routes.depositAsset(accountID)) : undefined,
      balanceDetails: accountID ? () => router.history.push(routes.balanceDetails(accountID)) : undefined,
      createPayment: accountID ? () => router.history.push(routes.createPayment(accountID)) : undefined,
      receivePayment: accountID ? () => router.history.push(routes.receivePayment(accountID)) : undefined,
      tradeAssets: accountID ? () => router.history.push(routes.tradeAsset(accountID)) : undefined,
      transactions: accountID ? () => router.history.push(routes.account(accountID)) : undefined,
      withdraw: accountID ? () => router.history.push(routes.withdrawAsset(accountID)) : undefined
    }
  }, [router.history, props.account])

  const closeAssetDetails = React.useCallback(() => {
    // We might need to go back to either "balance details" or "add assets"
    router.history.goBack()
  }, [router.history])

  const closeDialog = navigateTo.transactions || (() => undefined)

  const performRenaming = React.useCallback(
    (newName: string) => {
      if (props.account) {
        renameAccount(props.account.id, newName).catch(trackError)
      } else {
        setAccountCreation(creation => ({
          ...creation,
          name: newName
        }))
      }
    },
    [props.account, renameAccount]
  )

  const onCreateAccount = React.useCallback(() => {
    // FIXME
  }, [])

  // Let's memo the AccountHeaderCard as it's pretty expensive to re-render
  const headerCard = React.useMemo(
    () => (
      <AccountHeaderCard
        account={props.account || accountCreation}
        editableAccountName={showAccountSettings || showAccountCreation}
        onAccountSettings={navigateTo.accountSettings}
        onAccountTransactions={navigateTo.transactions}
        onClose={navigateTo.transactions}
        onDeposit={navigateTo.deposit}
        onManageAssets={navigateTo.balanceDetails}
        onRename={performRenaming}
        onTrade={navigateTo.tradeAssets}
        onWithdraw={navigateTo.withdraw}
      >
        {props.account ? (
          <ScrollableBalances account={props.account} onClick={navigateTo.balanceDetails} style={{ marginTop: 8 }} />
        ) : null}
        {isSmallScreen ? null : (
          <React.Suspense fallback={<InlineLoader />}>
            {props.account ? (
              <AccountActions
                account={props.account}
                hidden={!showSendReceiveButtons}
                onCreatePayment={navigateTo.createPayment!}
                onReceivePayment={navigateTo.receivePayment!}
              />
            ) : (
              <AccountCreationActions bottomOfScreen onCreateAccount={onCreateAccount} />
            )}
          </React.Suspense>
        )}
      </AccountHeaderCard>
    ),
    [
      accountCreation,
      isSmallScreen,
      navigateTo,
      onCreateAccount,
      performRenaming,
      props.account,
      showAccountCreation,
      showAccountSettings,
      showSendReceiveButtons
    ]
  )

  return (
    <VerticalLayout height="100%">
      <Section top brandColored grow={0} minHeight={headerHeight} shrink={0}>
        <React.Suspense fallback={<ViewLoading />}>{headerCard}</React.Suspense>
      </Section>
      <Section
        bottom={!isSmallScreen}
        style={{
          backgroundColor: "#fcfcfc",
          flexGrow: 1,
          flexShrink: 1,
          padding: isSmallScreen ? 0 : "0 24px",
          overflowY: "auto"
        }}
      >
        <React.Suspense fallback={<TransactionListPlaceholder />}>
          {showAccountCreation ? (
            <AccountCreationOptions />
          ) : showAccountSettings ? (
            <AccountSettings account={props.account!} />
          ) : (
            <AccountTransactions account={props.account!} />
          )}
        </React.Suspense>
      </Section>
      {isSmallScreen ? (
        <React.Suspense fallback={<ViewLoading />}>
          {props.account ? (
            <AccountActions
              account={props.account}
              bottomOfScreen
              hidden={!showSendReceiveButtons}
              onCreatePayment={navigateTo.createPayment!}
              onReceivePayment={navigateTo.receivePayment!}
            />
          ) : (
            <AccountCreationActions bottomOfScreen onCreateAccount={onCreateAccount} />
          )}
        </React.Suspense>
      ) : null}

      {props.account ? (
        <>
          <Dialog
            open={showBalanceDetails || showAssetDetails}
            fullScreen
            onClose={closeDialog}
            TransitionComponent={FullscreenDialogTransition}
          >
            <React.Suspense fallback={<ViewLoading />}>
              <BalanceDetailsDialog account={props.account} onClose={closeDialog} />
            </React.Suspense>
          </Dialog>
          <Dialog
            open={showAssetDetails}
            fullScreen
            onClose={navigateTo.balanceDetails}
            TransitionComponent={FullscreenDialogTransition}
          >
            <React.Suspense fallback={<ViewLoading />}>
              <AssetDetailsDialog
                account={props.account}
                assetID={showAssetDetails ? getLastArgumentFromURL(router.location.pathname) : "XLM"}
                onClose={closeAssetDetails}
              />
            </React.Suspense>
          </Dialog>
          <Dialog
            open={showCreatePayment}
            fullScreen
            onClose={closeDialog}
            TransitionComponent={FullscreenDialogTransition}
          >
            <React.Suspense fallback={<ViewLoading />}>
              <PaymentDialog account={props.account} onClose={closeDialog} />
            </React.Suspense>
          </Dialog>
          <Dialog
            open={showReceivePayment}
            fullScreen
            onClose={closeDialog}
            TransitionComponent={FullscreenDialogTransition}
          >
            <React.Suspense fallback={<ViewLoading />}>
              <ReceivePaymentDialog account={props.account} onClose={closeDialog} />
            </React.Suspense>
          </Dialog>
          <Dialog
            open={showAssetTrading}
            fullScreen
            onClose={closeDialog}
            TransitionComponent={FullscreenDialogTransition}
          >
            <React.Suspense fallback={<ViewLoading />}>
              <TradeAssetDialog account={props.account} onClose={closeDialog} />
            </React.Suspense>
          </Dialog>
          <Dialog
            open={showDeposit || showWithdrawal}
            fullScreen
            onClose={closeDialog}
            TransitionComponent={FullscreenDialogTransition}
          >
            <React.Suspense fallback={<ViewLoading />}>
              <TransferDialog
                account={props.account}
                onClose={closeDialog}
                type={showDeposit ? "deposit" : "withdrawal"}
              />
            </React.Suspense>
          </Dialog>
        </>
      ) : null}
    </VerticalLayout>
  )
})

type AccountPageProps =
  | {
      accountCreation?: undefined
      accountID: string
    }
  | {
      accountCreation: "pubnet" | "testnet"
      accountID?: undefined
    }

function AccountPage(props: AccountPageProps) {
  const { accounts } = React.useContext(AccountsContext)
  const account = props.accountID ? accounts.find(someAccount => someAccount.id === props.accountID) : undefined

  if (props.accountID && !account) {
    // FIXME: Use error boundaries
    return <div>Wallet account not found. ID: {props.accountID}</div>
  }

  return <AccountPageContent account={account} />
}

export default React.memo(AccountPage)
