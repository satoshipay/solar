import React from "react"
import { useTranslation } from "react-i18next"
import Dialog from "@material-ui/core/Dialog"
import AccountActions from "~Account/components/AccountActions"
import AccountCreationActions from "~AccountCreation/components/AccountCreationActions"
import NoPasswordConfirmation from "~AccountCreation/components/NoPasswordConfirmation"
import { AccountCreation } from "~AccountCreation/types/types"
import useAccountCreation from "~AccountCreation/hooks/useAccountCreation"
import AccountHeaderCard from "~Account/components/AccountHeaderCard"
import TransactionListPlaceholder from "~Account/components/TransactionListPlaceholder"
import InlineLoader from "~Generic/components/InlineLoader"
import { VerticalLayout } from "~Layout/components/Box"
import { Section } from "~Layout/components/Page"
import ScrollableBalances from "~Generic/components/ScrollableBalances"
import withFallback from "~Generic/hocs/withFallback"
import PaymentDialog from "~Payment/components/PaymentDialog"
import ReceivePaymentDialog from "~Payment/components/ReceivePaymentDialog"
import ViewLoading from "~Generic/components/ViewLoading"
import { Account, AccountsContext } from "../../App/contexts/accounts"
import { trackError } from "../../App/contexts/notifications"
import { useIsMobile, useRouter } from "~Generic/hooks/userinterface"
import { getLastArgumentFromURL } from "~Generic/lib/url"
import { matchesRoute } from "~Generic/lib/routes"
import * as routes from "~routes"
import { FullscreenDialogTransition } from "../../App/theme"

const modules = {
  AssetDetailsDialog: import("../../Assets/components/AssetDetailsDialog"),
  BalanceDetailsDialog: import("../../Assets/components/BalanceDetailsDialog"),
  TradeAssetDialog: import("../../Trading/components/TradingDialog"),
  TransferDialog: import("../../TransferService/components/ConnectedTransferDialog")
}

const AccountSettings = withFallback(
  React.lazy(() => import("../../AccountSettings/components/AccountSettings")),
  <TransactionListPlaceholder />
)
const AccountTransactions = withFallback(
  React.lazy(() => import("./AccountTransactions")),
  <TransactionListPlaceholder />
)
const AccountCreationOptions = withFallback(
  React.lazy(() => import("../../AccountCreation/components/AccountCreationOptions")),
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
  const { renameAccount } = React.useContext(AccountsContext)
  const [accountToBackup, setAccountToBackup] = React.useState<Account | null>(null)
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
    [props.account, renameAccount, setAccountCreation]
  )

  const updateAccountCreation = React.useCallback(
    (update: Partial<AccountCreation>) => {
      setAccountCreation(prev => ({
        ...prev,
        ...update
      }))
    },
    [setAccountCreation]
  )

  const createNewAccount = React.useCallback(() => {
    ;(async () => {
      const account = await createAccount(accountCreation)

      if (!accountCreation.import && !props.testnet) {
        setAccountToBackup(account)
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
    if (accountToBackup) {
      router.history.push(routes.account(accountToBackup.id))
    }
  }, [accountToBackup, router.history])

  const handleBackNavigation = React.useCallback(() => {
    if (props.account && matchesRoute(router.location.pathname, routes.accountSettings(props.account.id))) {
      router.history.push(routes.account(props.account.id))
    } else if (showAccountCreation && accountToBackup) {
      setAccountToBackup(null)
    } else if (showAccountCreation) {
      router.history.push(routes.routeUp(router.location.pathname))
    } else {
      router.history.push(routes.allAccounts())
    }
  }, [accountToBackup, props.account, router.history, router.location, showAccountCreation])

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
        onClose={handleBackNavigation}
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
      handleBackNavigation,
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
            <AccountCreationOptions
              accountCreation={accountCreation}
              accountToBackup={accountToBackup}
              errors={accountCreationErrors}
              onFinishBackup={closeBackupDialog}
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
      ) : !props.account && !accountToBackup ? (
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
