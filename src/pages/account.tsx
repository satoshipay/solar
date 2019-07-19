import React from "react"
import Button from "@material-ui/core/Button"
import CircularProgress from "@material-ui/core/CircularProgress"
import Dialog from "@material-ui/core/Dialog"
import Slide from "@material-ui/core/Slide"
import Typography from "@material-ui/core/Typography"
import DoneAllIcon from "@material-ui/icons/DoneAll"
import SendIcon from "@material-ui/icons/Send"
import UpdateIcon from "@material-ui/icons/Update"
import ButtonIconLabel from "../components/ButtonIconLabel"
import AccountBalances from "../components/Account/AccountBalances"
import AccountBalancesContainer from "../components/Account/AccountBalancesContainer"
import AccountHeaderCard from "../components/Account/AccountHeaderCard"
import FriendbotButton from "../components/Account/FriendbotButton"
import OfferList from "../components/Account/OfferList"
import { InteractiveSignatureRequestList } from "../components/Account/SignatureRequestList"
import TransactionList from "../components/Account/TransactionList"
import ManageAssetsDialog from "../components/Dialog/ManageAssets"
import ManageSignersDialog from "../components/Dialog/ManageSigners"
import ReceivePaymentDialog from "../components/Dialog/ReceivePayment"
import TradeAssetDialog from "../components/Dialog/TradeAsset"
import { MinimumAccountBalance } from "../components/Fetchers"
import QRCodeIcon from "../components/Icon/QRCode"
import { HorizontalLayout, VerticalLayout } from "../components/Layout/Box"
import { HorizontalMargin } from "../components/Layout/Spacing"
import { Section } from "../components/Layout/Page"
import CreatePaymentDialog from "../components/Payment/CreatePaymentDialog"
import { Account, AccountsContext } from "../context/accounts"
import { SettingsContext } from "../context/settings"
import { SignatureDelegationContext } from "../context/signatureDelegation"
import { useIsMobile, useAccountData, useHorizon, useRecentTransactions, useRouter } from "../hooks"
import { hasSigned } from "../lib/transaction"
import * as routes from "../routes"

const DialogTransition = (props: any) => <Slide {...props} direction="left" />

interface AccountActionsProps {
  account: Account
  bottomOfScreen?: boolean
  horizontalMargin: number
  onCreatePayment: () => void
  onReceivePayment: () => void
  squareButtons?: boolean
  style?: React.CSSProperties
}

function AccountActions(props: AccountActionsProps) {
  const accountData = useAccountData(props.account.publicKey, props.account.testnet)
  const buttonStyle = {
    border: "none",
    borderRadius: props.squareButtons ? 0 : undefined,
    fontSize: "1rem",
    flexBasis: 1,
    flexGrow: 1,
    padding: 20
  }
  return (
    <HorizontalLayout
      style={{
        flexGrow: 0,
        flexShrink: 0,
        background: props.bottomOfScreen ? "white" : undefined,
        paddingBottom: "env(safe-area-inset-bottom)",
        ...props.style
      }}
    >
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
  )
}

function PendingMultisigTransactions(props: { account: Account }) {
  const { pendingSignatureRequests } = React.useContext(SignatureDelegationContext)

  const cosignIcon = React.useMemo(() => <DoneAllIcon />, [])
  const waitingIcon = React.useMemo(() => <UpdateIcon style={{ opacity: 0.5 }} />, [])

  const pendingRequestsToCosign = React.useMemo(
    () => {
      return pendingSignatureRequests.filter(
        request =>
          request._embedded.signers.some(signer => signer.account_id === props.account.publicKey) &&
          !hasSigned(request.meta.transaction, props.account.publicKey)
      )
    },
    [props.account, pendingSignatureRequests]
  )

  const pendingRequestsWaitingForOthers = React.useMemo(
    () => {
      return pendingSignatureRequests.filter(
        request =>
          request._embedded.signers.some(signer => signer.account_id === props.account.publicKey) &&
          hasSigned(request.meta.transaction, props.account.publicKey)
      )
    },
    [props.account, pendingSignatureRequests]
  )

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

function Transactions(props: { account: Account }) {
  const { account } = props
  const horizon = useHorizon(account.testnet)
  const recentTxs = useRecentTransactions(account.publicKey, account.testnet)
  const settings = React.useContext(SettingsContext)

  return (
    <>
      {recentTxs.loading ? (
        <HorizontalLayout alignItems="center" justifyContent="center" height="100%" padding={16} width="100%">
          <CircularProgress />
        </HorizontalLayout>
      ) : recentTxs.activated ? (
        <>
          {settings.multiSignature ? <PendingMultisigTransactions account={account} /> : null}
          <OfferList account={account} title="Open offers" />
          <TransactionList
            account={account}
            background="transparent"
            title="Recent transactions"
            testnet={account.testnet}
            transactions={recentTxs.transactions}
          />
        </>
      ) : (
        <>
          <Typography align="center" color="textSecondary" style={{ margin: "30px auto" }}>
            Account does not yet exist on the network. Send at least <MinimumAccountBalance testnet={account.testnet} />
            &nbsp;XLM to activate the account.
          </Typography>
          {account.testnet ? (
            <Typography align="center" style={{ paddingBottom: 30 }}>
              <FriendbotButton horizon={horizon} publicKey={account.publicKey} />
            </Typography>
          ) : null}
        </>
      )}
    </>
  )
}

interface Props {
  accountID: string
  showAssetManagement: boolean
  showAssetTrading: boolean
  showCreatePayment: boolean
  showReceivePayment: boolean
  showSignersManagement: boolean
}

function AccountPage(props: Props) {
  const { accounts, renameAccount } = React.useContext(AccountsContext)
  const isSmallScreen = useIsMobile()
  const router = useRouter()

  const onCloseDialog = React.useCallback(() => router.history.push(routes.account(props.accountID)), [
    router.history,
    props.accountID
  ])
  const onCreatePayment = React.useCallback(() => router.history.push(routes.createPayment(props.accountID)), [
    router.history,
    props.accountID
  ])
  const onManageAssets = React.useCallback(() => router.history.push(routes.manageAccountAssets(props.accountID)), [
    router.history,
    props.accountID
  ])
  const onManageSigners = React.useCallback(() => router.history.push(routes.manageAccountSigners(props.accountID)), [
    router.history,
    props.accountID
  ])
  const onReceivePayment = React.useCallback(() => router.history.push(routes.receivePayment(props.accountID)), [
    router.history,
    props.accountID
  ])

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
          onManageAssets={onManageAssets}
          onManageSigners={onManageSigners}
          onRenameAccount={renameAccount}
        >
          <AccountBalancesContainer>
            <AccountBalances publicKey={account.publicKey} testnet={account.testnet} />
          </AccountBalancesContainer>
          {isSmallScreen ? null : (
            <AccountActions
              account={account}
              horizontalMargin={40}
              onCreatePayment={onCreatePayment}
              onReceivePayment={onReceivePayment}
              style={{ marginTop: 40 }}
            />
          )}
        </AccountHeaderCard>
      </Section>
      <Section
        bottom={!isSmallScreen}
        backgroundColor="#f6f6f6"
        style={{
          flexGrow: 1,
          flexShrink: 1,
          paddingTop: 0,
          paddingBottom: 0,
          overflowY: "auto"
        }}
      >
        <Transactions account={account} />
      </Section>
      {isSmallScreen ? (
        <AccountActions
          account={account}
          bottomOfScreen
          horizontalMargin={0}
          onCreatePayment={() => router.history.push(routes.createPayment(props.accountID))}
          onReceivePayment={() => router.history.push(routes.receivePayment(props.accountID))}
          squareButtons
          style={{ boxShadow: "0 -8px 16px 0 rgba(0, 0, 0, 0.1)", zIndex: 1 }}
        />
      ) : null}

      <Dialog open={props.showCreatePayment} fullScreen onClose={onCloseDialog} TransitionComponent={DialogTransition}>
        <CreatePaymentDialog account={account} onClose={onCloseDialog} />
      </Dialog>
      <Dialog
        open={props.showAssetManagement}
        fullScreen
        onClose={onCloseDialog}
        TransitionComponent={DialogTransition}
      >
        <ManageAssetsDialog account={account} onClose={onCloseDialog} />
      </Dialog>
      <Dialog
        open={props.showSignersManagement}
        fullScreen
        onClose={onCloseDialog}
        TransitionComponent={DialogTransition}
      >
        <ManageSignersDialog account={account} onClose={onCloseDialog} />
      </Dialog>
      <Dialog open={props.showReceivePayment} fullScreen onClose={onCloseDialog} TransitionComponent={DialogTransition}>
        <ReceivePaymentDialog account={account} onClose={onCloseDialog} />
      </Dialog>
      <Dialog open={props.showAssetTrading} fullScreen onClose={onCloseDialog} TransitionComponent={DialogTransition}>
        <TradeAssetDialog account={account} onClose={onCloseDialog} />
      </Dialog>
    </VerticalLayout>
  )
}

export default AccountPage
