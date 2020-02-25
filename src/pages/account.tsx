import React from "react"
import { useTranslation } from "react-i18next"
import Dialog from "@material-ui/core/Dialog"
import AccountActions from "../components/Account/AccountActions"
import AccountCreationActions from "../components/AccountCreation/AccountCreationActions"
import useAccountCreation from "../components/AccountCreation/useAccountCreation"
import AccountHeaderCard from "../components/Account/AccountHeaderCard"
import TransactionListPlaceholder from "../components/Account/TransactionListPlaceholder"
import NoPasswordConfirmation from "../components/AccountCreation/NoPasswordConfirmation"
import { AccountCreation, AccountCreationErrors } from "../components/AccountCreation/types"
import ExportKeyDialog from "../components/AccountSettings/ExportKeyDialog"
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

const AccountSettings = withFallback(
  React.lazy(() => import("../components/AccountSettings/AccountSettings")),
  <TransactionListPlaceholder />
)
const AccountTransactions = withFallback(
  React.lazy(() => import("../components/Account/AccountTransactions")),
  <TransactionListPlaceholder />
)
const NewAccountSetup = withFallback(
  React.lazy(() => import("../components/AccountCreation/NewAccountSetup")),
  <ViewLoading />
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

interface AccountPageContentProps {
  account: Account | undefined
  testnet: boolean
}

const AccountPageContent = React.memo(function AccountPageContent(props: AccountPageContentProps) {
  const isSmallScreen = useIsMobile()
  const router = useRouter()
  const { t } = useTranslation()
  const { accounts, renameAccount } = React.useContext(AccountsContext)
  const [createdAccount, setCreatedAccount] = React.useState<Account | null>(null)
  const [noPasswordDialogOpen, setNoPasswordDialogOpen] = React.useState(false)

  const showAccountCreation =
    matchesRoute(router.location.pathname, routes.createAccount(props.testnet), false) ||
    matchesRoute(router.location.pathname, routes.importAccount(props.testnet), false) ||
    matchesRoute(router.location.pathname, routes.newAccount(props.testnet), false)

  const showAccountCreationOptions = matchesRoute(router.location.pathname, routes.newAccount(props.testnet), false)

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

  const {
    accountCreation,
    accountCreationErrors,
    createAccount,
    setAccountCreation,
    validateAccountCreation
  } = useAccountCreation({
    import: matchesRoute(router.location.pathname, routes.importAccount(props.testnet), false),
    testnet: props.testnet
  })

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

  const updateAccountCreation = React.useCallback((update: Partial<AccountCreation>) => {
    setAccountCreation(prev => ({
      ...prev,
      ...update
    }))
  }, [])

  const createNewAccount = React.useCallback(() => {
    ;(async () => {
      const account = await createAccount(accountCreation)

      if (!accountCreation.import && !props.testnet) {
        setCreatedAccount(account)
      } else {
        router.history.push(routes.account(account.id))
      }
    })().catch(trackError)
  }, [accountCreation, createAccount, props.testnet, router.history])

  const onCreateAccount = React.useCallback(() => {
    if (!validateAccountCreation(accountCreation)) {
      return
    }

    if (!accountCreation.requiresPassword && !props.testnet) {
      setNoPasswordDialogOpen(true)
    } else {
      createNewAccount()
    }
  }, [accountCreation, createNewAccount, props.testnet, validateAccountCreation])

  const closeNoPasswordDialog = React.useCallback(() => {
    setNoPasswordDialogOpen(false)
  }, [])

  const confirmNoPasswordDialog = React.useCallback(() => {
    setNoPasswordDialogOpen(false)
    createNewAccount()
  }, [createNewAccount])

  const closeBackupDialog = React.useCallback(() => {
    if (createdAccount) {
      router.history.push(routes.account(createdAccount.id))
    }
  }, [createdAccount, router.history])

  const creationTitle = props.testnet
    ? t("create-account.header.placeholder.testnet")
    : t("create-account.header.placeholder.mainnet")

  // Let's memo the AccountHeaderCard as it's pretty expensive to re-render
  const headerCard = React.useMemo(
    () => (
      <AccountHeaderCard
        account={
          showAccountCreationOptions ? { ...accountCreation, name: creationTitle } : props.account || accountCreation
        }
        editableAccountName={showAccountSettings || (showAccountCreation && !showAccountCreationOptions)}
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
        {isSmallScreen || !props.account ? null : (
          <React.Suspense fallback={<InlineLoader />}>
            <AccountActions
              account={props.account}
              hidden={!showSendReceiveButtons}
              onCreatePayment={navigateTo.createPayment!}
              onReceivePayment={navigateTo.receivePayment!}
            />
          </React.Suspense>
        )}
      </AccountHeaderCard>
    ),
    [
      accountCreation,
      creationTitle,
      isSmallScreen,
      navigateTo,
      performRenaming,
      props.account,
      showAccountCreation,
      showAccountCreationOptions,
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
        {showAccountCreation ? (
          <React.Suspense fallback={<ViewLoading />}>
            <NewAccountSetup
              accountCreation={accountCreation}
              errors={accountCreationErrors}
              onUpdateAccountCreation={updateAccountCreation}
            />
          </React.Suspense>
        ) : showAccountSettings ? (
          <React.Suspense fallback={<TransactionListPlaceholder />}>
            <AccountSettings account={props.account!} />
          </React.Suspense>
        ) : (
          <React.Suspense fallback={<TransactionListPlaceholder />}>
            <AccountTransactions account={props.account!} />
          </React.Suspense>
        )}
      </Section>
      {isSmallScreen && props.account ? (
        <React.Suspense fallback={<ViewLoading />}>
          <AccountActions
            account={props.account}
            bottomOfScreen
            hidden={!showSendReceiveButtons}
            onCreatePayment={navigateTo.createPayment!}
            onReceivePayment={navigateTo.receivePayment!}
          />
        </React.Suspense>
      ) : !props.account ? (
        <AccountCreationActions
          bottomOfScreen={isSmallScreen}
          onActionButtonClick={onCreateAccount}
          testnet={props.testnet}
        />
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
      {props.account ? null : (
        <NoPasswordConfirmation
          onClose={closeNoPasswordDialog}
          onConfirm={confirmNoPasswordDialog}
          open={noPasswordDialogOpen}
        />
      )}
      <Dialog
        fullScreen
        open={createdAccount !== null}
        onClose={closeBackupDialog}
        TransitionComponent={FullscreenDialogTransition}
      >
        <ExportKeyDialog account={createdAccount!} onConfirm={closeBackupDialog} variant="initial-backup" />
      </Dialog>
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

  return (
    <AccountPageContent account={account} testnet={account ? account.testnet : props.accountCreation === "testnet"} />
  )
}

export default React.memo(AccountPage)
