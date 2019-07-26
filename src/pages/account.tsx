import React from "react"
import Button from "@material-ui/core/Button"
import Collapse from "@material-ui/core/Collapse"
import Dialog from "@material-ui/core/Dialog"
import Slide from "@material-ui/core/Slide"
import { TransitionProps } from "@material-ui/core/transitions/transition"
import SendIcon from "@material-ui/icons/Send"
import ButtonIconLabel from "../components/ButtonIconLabel"
import AccountBalances from "../components/Account/AccountBalances"
import AccountBalancesContainer from "../components/Account/AccountBalancesContainer"
import AccountHeaderCard from "../components/Account/AccountHeaderCard"
import AccountTransactions from "../components/Account/AccountTransactions"
import AccountSettings from "../components/AccountSettings/AccountSettings"
import ManageAssetsDialog from "../components/Dialog/ManageAssets"
import ReceivePaymentDialog from "../components/Dialog/ReceivePayment"
import TradeAssetDialog from "../components/Dialog/TradeAsset"
import QRCodeIcon from "../components/Icon/QRCode"
import { HorizontalLayout, VerticalLayout } from "../components/Layout/Box"
import { HorizontalMargin } from "../components/Layout/Spacing"
import { Section } from "../components/Layout/Page"
import CreatePaymentDialog from "../components/Payment/CreatePaymentDialog"
import WithdrawalDialog from "../components/Withdrawal/WithdrawalDialog"
import { Account, AccountsContext } from "../context/accounts"
import { useIsMobile, useAccountData, useRouter } from "../hooks"
import { matchesRoute } from "../lib/routes"
import * as routes from "../routes"

const DialogTransition = React.forwardRef((props: TransitionProps, ref) => (
  <Slide ref={ref} {...props} direction="left" />
))

interface AccountActionsProps {
  account: Account
  bottomOfScreen?: boolean
  hidden?: boolean
  horizontalMargin: number
  onCreatePayment: () => void
  onReceivePayment: () => void
  squareButtons?: boolean
  style?: React.CSSProperties
}

function AccountActions(props: AccountActionsProps) {
  const accountData = useAccountData(props.account.publicKey, props.account.testnet)
  const isSmallScreen = useIsMobile()
  const buttonStyle = {
    border: "none",
    borderRadius: isSmallScreen ? 0 : 8,
    fontSize: "1rem",
    flexBasis: 1,
    flexGrow: 1,
    padding: 20
  }
  return (
    <Collapse
      in={!props.hidden}
      style={{
        flexGrow: 0,
        flexShrink: 0,
        background: props.bottomOfScreen ? "white" : undefined,
        paddingBottom: "env(safe-area-inset-bottom)",
        ...props.style
      }}
    >
      <HorizontalLayout>
        <Button variant="contained" onClick={props.onReceivePayment} style={buttonStyle}>
          <ButtonIconLabel label="Receive">
            <QRCodeIcon style={{ fontSize: "110%" }} />
          </ButtonIconLabel>
        </Button>
        {props.horizontalMargin > 0 ? <HorizontalMargin size={props.horizontalMargin} /> : null}
        <Button
          color="primary"
          variant="contained"
          disabled={!accountData.activated}
          onClick={props.onCreatePayment}
          style={buttonStyle}
        >
          <ButtonIconLabel label="Send">
            <SendIcon style={{ fontSize: "110%" }} />
          </ButtonIconLabel>
        </Button>
      </HorizontalLayout>
    </Collapse>
  )
}

interface Props {
  accountID: string
}

function AccountPage(props: Props) {
  const { accounts } = React.useContext(AccountsContext)
  const isSmallScreen = useIsMobile()
  const router = useRouter()

  const showAccountSettings = matchesRoute(router.location.pathname, routes.accountSettings("*"), false)
  const showAssetManagement = matchesRoute(router.location.pathname, routes.manageAccountAssets("*"))
  const showAssetTrading = matchesRoute(router.location.pathname, routes.tradeAsset("*"))
  const showCreatePayment = matchesRoute(router.location.pathname, routes.createPayment("*"))
  const showReceivePayment = matchesRoute(router.location.pathname, routes.receivePayment("*"))
  const showWithdrawal = matchesRoute(router.location.pathname, routes.withdrawAsset("*"))

  const showSendReceiveButtons = !matchesRoute(router.location.pathname, routes.accountSettings("*"), false)

  const navigateTo = React.useMemo(
    () => ({
      accountSettings: () => router.history.push(routes.accountSettings(props.accountID)),
      createPayment: () => router.history.push(routes.createPayment(props.accountID)),
      manageAssets: () => router.history.push(routes.manageAccountAssets(props.accountID)),
      receivePayment: () => router.history.push(routes.receivePayment(props.accountID)),
      tradeAssets: () => router.history.push(routes.tradeAsset(props.accountID)),
      transactions: () => router.history.push(routes.account(props.accountID)),
      withdraw: () => router.history.push(routes.withdrawAsset(props.accountID))
    }),
    [router.history, props.accountID]
  )

  const account = accounts.find(someAccount => someAccount.id === props.accountID)
  if (!account) {
    // FIXME: Use error boundaries
    return <div>Wallet account not found. ID: {props.accountID}</div>
  }

  return (
    <VerticalLayout height="100%">
      <Section top brandColored grow={0}>
        <AccountHeaderCard
          account={account}
          editableAccountName={showAccountSettings}
          onAccountSettings={navigateTo.accountSettings}
          onClose={navigateTo.transactions}
          onManageAssets={navigateTo.manageAssets}
          onTrade={navigateTo.tradeAssets}
          onWithdraw={navigateTo.withdraw}
          showCloseButton={showAccountSettings}
        >
          <AccountBalancesContainer>
            <AccountBalances publicKey={account.publicKey} testnet={account.testnet} />
          </AccountBalancesContainer>
          {isSmallScreen ? null : (
            <AccountActions
              account={account}
              hidden={!showSendReceiveButtons}
              horizontalMargin={40}
              onCreatePayment={navigateTo.createPayment}
              onReceivePayment={navigateTo.receivePayment}
              style={{ paddingTop: 40 }}
            />
          )}
        </AccountHeaderCard>
      </Section>
      <Section
        bottom={!isSmallScreen}
        style={{
          flexGrow: 1,
          flexShrink: 1,
          padding: "0 24px",
          overflowY: "auto"
        }}
      >
        {showAccountSettings ? <AccountSettings account={account} /> : <AccountTransactions account={account} />}
      </Section>
      {isSmallScreen ? (
        <AccountActions
          account={account}
          bottomOfScreen
          hidden={!showSendReceiveButtons}
          horizontalMargin={0}
          onCreatePayment={() => router.history.push(routes.createPayment(props.accountID))}
          onReceivePayment={() => router.history.push(routes.receivePayment(props.accountID))}
          squareButtons
          style={{ boxShadow: "0 -8px 16px 0 rgba(0, 0, 0, 0.1)", zIndex: 1 }}
        />
      ) : null}

      <Dialog
        open={showCreatePayment}
        fullScreen
        onClose={navigateTo.transactions}
        TransitionComponent={DialogTransition}
      >
        <CreatePaymentDialog account={account} onClose={navigateTo.transactions} />
      </Dialog>
      <Dialog
        open={showAssetManagement}
        fullScreen
        onClose={navigateTo.transactions}
        TransitionComponent={DialogTransition}
      >
        <ManageAssetsDialog account={account} onClose={navigateTo.transactions} />
      </Dialog>
      <Dialog
        open={showReceivePayment}
        fullScreen
        onClose={navigateTo.transactions}
        TransitionComponent={DialogTransition}
      >
        <ReceivePaymentDialog account={account} onClose={navigateTo.transactions} />
      </Dialog>
      <Dialog
        open={showAssetTrading}
        fullScreen
        onClose={navigateTo.transactions}
        TransitionComponent={DialogTransition}
      >
        <TradeAssetDialog account={account} onClose={navigateTo.transactions} />
      </Dialog>
      <Dialog open={showWithdrawal} fullScreen onClose={navigateTo.transactions} TransitionComponent={DialogTransition}>
        <WithdrawalDialog account={account} onClose={navigateTo.transactions} />
      </Dialog>
    </VerticalLayout>
  )
}

export default React.memo(AccountPage)
