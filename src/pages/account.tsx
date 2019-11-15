import React from "react"
import Dialog from "@material-ui/core/Dialog"
import { makeStyles } from "@material-ui/core/styles"
import SendIcon from "@material-ui/icons/Send"
import AccountHeaderCard from "../components/Account/AccountHeaderCard"
import AccountTransactions from "../components/Account/AccountTransactions"
import AssetDetailsDialog from "../components/AccountAssets/AssetDetailsDialog"
import BalanceDetailsDialog from "../components/AccountAssets/BalanceDetailsDialog"
import ScrollableBalances from "../components/AccountAssets/ScrollableBalances"
import AccountSettings from "../components/AccountSettings/AccountSettings"
import { ActionButton, DialogActionsBox } from "../components/Dialog/Generic"
import QRCodeIcon from "../components/Icon/QRCode"
import { VerticalLayout } from "../components/Layout/Box"
import { Section } from "../components/Layout/Page"
import PaymentDialog from "../components/Payment/PaymentDialog"
import ReceivePaymentDialog from "../components/Payment/ReceivePaymentDialog"
import TradeAssetDialog from "../components/Trading/TradingDialog"
import WithdrawalDialog from "../components/Withdrawal/WithdrawalDialog"
import { Account, AccountsContext } from "../context/accounts"
import { useLiveAccountData } from "../hooks/stellar-subscriptions"
import { useIsMobile, useRouter } from "../hooks/userinterface"
import { matchesRoute } from "../lib/routes"
import * as routes from "../routes"
import { FullscreenDialogTransition } from "../theme"
import DepositDialog from "../components/Deposit/DepositDialog"

const useButtonStyles = makeStyles(theme => ({
  desktop: {
    margin: 0,
    padding: "24px 0 0",

    "& $button:firt-child": {
      marginRight: 40
    },
    "& $button:last-child": {
      marginLeft: 40
    }
  },
  mobile: {},
  hidden: {
    paddingTop: 0
  },
  collapse: {
    width: "100%",
    zIndex: 1
  },
  button: {
    border: "none",
    borderRadius: 8,
    boxShadow: "0 8px 16px 0 rgba(0, 0, 0, 0.1)",
    fontSize: "1rem",
    flexBasis: 1,
    flexGrow: 1,
    padding: "20px !important"
  },
  secondaryButton: {
    background: "white",
    color: theme.palette.primary.dark
  }
}))

interface AccountActionsProps {
  account: Account
  bottomOfScreen?: boolean
  hidden?: boolean
  onCreatePayment: () => void
  onReceivePayment: () => void
}

// tslint:disable-next-line no-shadowed-variable
const AccountActions = React.memo(function AccountActions(props: AccountActionsProps) {
  const [accountData] = useLiveAccountData(props.account.publicKey, props.account.testnet)
  const classes = useButtonStyles()
  const className = `${props.bottomOfScreen ? classes.mobile : classes.desktop} ${props.hidden ? classes.hidden : ""}`
  return (
    <DialogActionsBox className={className} hidden={props.hidden}>
      <ActionButton
        className={`${classes.button} ${classes.secondaryButton}`}
        icon={<QRCodeIcon style={{ fontSize: "110%" }} />}
        onClick={props.onReceivePayment}
        variant="contained"
      >
        Receive
      </ActionButton>
      <ActionButton
        className={classes.button}
        disabled={accountData.balances.length === 0}
        icon={<SendIcon style={{ fontSize: "110%" }} />}
        onClick={props.onCreatePayment}
        type="primary"
      >
        Send
      </ActionButton>
    </DialogActionsBox>
  )
})

// tslint:disable-next-line no-shadowed-variable
const AccountPageContent = React.memo(function AccountPageContent(props: { account: Account }) {
  const isSmallScreen = useIsMobile()
  const router = useRouter()

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

  const navigateTo = React.useMemo(
    () => ({
      accountSettings: () => router.history.push(routes.accountSettings(props.account.id)),
      addAssets: () => router.history.push(routes.manageAccountAssets(props.account.id)),
      deposit: () => router.history.push(routes.depositAsset(props.account.id)),
      balanceDetails: () => router.history.push(routes.balanceDetails(props.account.id)),
      createPayment: () => router.history.push(routes.createPayment(props.account.id)),
      receivePayment: () => router.history.push(routes.receivePayment(props.account.id)),
      tradeAssets: () => router.history.push(routes.tradeAsset(props.account.id)),
      transactions: () => router.history.push(routes.account(props.account.id)),
      withdraw: () => router.history.push(routes.withdrawAsset(props.account.id))
    }),
    [router.history.push, props.account.id]
  )

  const closeAssetDetails = React.useCallback(() => {
    // We might need to go back to either "balance details" or "add assets"
    router.history.goBack()
  }, [navigateTo, router.history])

  // Let's memo the AccountHeaderCard as it's pretty expensive to re-render
  const headerCard = React.useMemo(
    () => (
      <AccountHeaderCard
        account={props.account}
        editableAccountName={showAccountSettings}
        onAccountSettings={navigateTo.accountSettings}
        onClose={navigateTo.transactions}
        onDeposit={navigateTo.deposit}
        onManageAssets={navigateTo.balanceDetails}
        onTrade={navigateTo.tradeAssets}
        onWithdraw={navigateTo.withdraw}
        showCloseButton={showAccountSettings}
      >
        <ScrollableBalances account={props.account} onClick={navigateTo.balanceDetails} style={{ marginTop: 8 }} />
        {isSmallScreen ? null : (
          <AccountActions
            account={props.account}
            hidden={!showSendReceiveButtons}
            onCreatePayment={navigateTo.createPayment}
            onReceivePayment={navigateTo.receivePayment}
          />
        )}
      </AccountHeaderCard>
    ),
    [isSmallScreen, navigateTo, props.account, showAccountSettings, showSendReceiveButtons]
  )

  return (
    <VerticalLayout height="100%">
      <Section top brandColored grow={0}>
        {headerCard}
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
        {showAccountSettings ? (
          <AccountSettings account={props.account} />
        ) : (
          <AccountTransactions account={props.account} />
        )}
      </Section>
      {isSmallScreen ? (
        <AccountActions
          account={props.account}
          bottomOfScreen
          hidden={!showSendReceiveButtons}
          onCreatePayment={navigateTo.createPayment}
          onReceivePayment={navigateTo.receivePayment}
        />
      ) : null}

      <Dialog
        open={showBalanceDetails || showAssetDetails}
        fullScreen
        onClose={navigateTo.transactions}
        TransitionComponent={FullscreenDialogTransition}
      >
        <BalanceDetailsDialog account={props.account} onClose={navigateTo.transactions} />
      </Dialog>
      <Dialog
        open={showAssetDetails}
        fullScreen
        onClose={navigateTo.balanceDetails}
        TransitionComponent={FullscreenDialogTransition}
      >
        <AssetDetailsDialog
          account={props.account}
          assetID={showAssetDetails ? router.location.pathname.replace(/^.*\/([^\/]+)/, "$1") : "XLM"}
          onClose={closeAssetDetails}
        />
      </Dialog>
      <Dialog
        open={showCreatePayment}
        fullScreen
        onClose={navigateTo.transactions}
        TransitionComponent={FullscreenDialogTransition}
      >
        <PaymentDialog account={props.account} onClose={navigateTo.transactions} />
      </Dialog>
      <Dialog
        open={showReceivePayment}
        fullScreen
        onClose={navigateTo.transactions}
        TransitionComponent={FullscreenDialogTransition}
      >
        <ReceivePaymentDialog account={props.account} onClose={navigateTo.transactions} />
      </Dialog>
      <Dialog
        open={showAssetTrading}
        fullScreen
        onClose={navigateTo.transactions}
        TransitionComponent={FullscreenDialogTransition}
      >
        <TradeAssetDialog account={props.account} onClose={navigateTo.transactions} />
      </Dialog>
      <Dialog
        open={showWithdrawal}
        fullScreen
        onClose={navigateTo.transactions}
        TransitionComponent={FullscreenDialogTransition}
      >
        <WithdrawalDialog account={props.account} onClose={navigateTo.transactions} />
      </Dialog>
      <Dialog
        open={showDeposit}
        fullScreen
        onClose={navigateTo.deposit}
        TransitionComponent={FullscreenDialogTransition}
      >
        <DepositDialog account={props.account} onClose={navigateTo.transactions} />
      </Dialog>
    </VerticalLayout>
  )
})

function AccountPage(props: { accountID: string }) {
  const { accounts } = React.useContext(AccountsContext)
  const account = accounts.find(someAccount => someAccount.id === props.accountID)

  if (!account) {
    // FIXME: Use error boundaries
    return <div>Wallet account not found. ID: {props.accountID}</div>
  }

  return <AccountPageContent account={account} />
}

export default React.memo(AccountPage)
